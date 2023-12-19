import {
  Dispatch,
  ReactNode,
  Reducer,
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { BitcoinNetwork } from "../utils/interface";
import { BitcoinAccount, getAccounts, getNetworkInSnap } from "../utils";
import { toast } from "react-toastify";
import { getBalance } from "../api/mempool/address";
import { MetaMaskContext } from "./MetamaskContext";
import { Utxo, getUtxo } from "../api/mempool/utxo";
import { getOrdinalsFromUtxo } from "../api/xverse/inscription";
import { Ordinal, getOrdinals } from "../api/xverse/wallet";

export type BitcoinBalance = {
  [address: string]: number;
};

type NetworkState = {
  network: BitcoinNetwork | null;
};

type AccountState = {
  accounts: BitcoinAccount[];
};

type BalanceState = {
  balance: BitcoinBalance;
  totalBalance: number;
};

type OrdUtxoMap = { [inscriptionId: string]: Utxo };

type UtxoState = {
  nonOrdUtxo: Utxo[];
  selectedUtxo: Utxo[];
  totalUtxoValue: number;
  ordinals: Ordinal[];
  ordUtxo: OrdUtxoMap;
};

const initialState: AppState = {
  // network
  network: null,
  // accounts
  accounts: [],
  // balance
  balance: {},
  totalBalance: 0,
  // utxo
  nonOrdUtxo: [],
  selectedUtxo: [],
  totalUtxoValue: 0,
  // ordinals
  ordinals: [],
  ordUtxo: {},
};

type AppState = NetworkState & AccountState & BalanceState & UtxoState;
type AppDispatch = { type: AppActions; payload: any };

export const AppContext = createContext<[AppState, Dispatch<AppDispatch>]>([
  initialState,
  () => {
    /* no op */
  },
]);

export enum AppActions {
  SwitchNetwork = "SwitchNetwork",
  LoadAccounts = "LoadAccounts",
  SetBalance = "SetBalance",
  AddAccount = "AddAccount",
  AddAccounts = "AddAccounts",
  SetUtxo = "SetUtxo",
  SelectUtxo = "SelectUtxo",
  SetOrdinals = "SetOrdinals",
}

const reducer: Reducer<AppState, AppDispatch> = (state, action) => {
  switch (action.type) {
    case AppActions.SwitchNetwork:
      return {
        ...state,
        network: action.payload,
      };
    case AppActions.LoadAccounts:
      return {
        ...state,
        accounts: action.payload,
      };
    case AppActions.SetBalance:
      return {
        ...state,
        ...action.payload,
      };
    case AppActions.AddAccount:
      return {
        ...state,
        accounts: [...state.accounts, action.payload],
      };
    case AppActions.AddAccounts:
      return {
        ...state,
        accounts: [...state.accounts, ...action.payload],
      };
    case AppActions.SetUtxo:
      return {
        ...state,
        ...action.payload,
      };
    case AppActions.SelectUtxo:
      const index: number = action.payload;
      const { selectedUtxo, nonOrdUtxo } = state;
      let newSelectedUtxo: Utxo[] = [];
      if (
        selectedUtxo.findIndex(
          (utxo) =>
            utxo.txid === nonOrdUtxo[index].txid &&
            utxo.vout === nonOrdUtxo[index].vout
        ) === -1
      ) {
        newSelectedUtxo = [...selectedUtxo, nonOrdUtxo[index]];
      } else {
        newSelectedUtxo = selectedUtxo.filter(
          (utxo) =>
            utxo.txid !== nonOrdUtxo[index].txid ||
            utxo.vout !== nonOrdUtxo[index].vout
        );
      }

      return {
        ...state,
        selectedUtxo: newSelectedUtxo,
        totalUtxoValue: newSelectedUtxo.reduce(
          (acc, value) => acc + value.value,
          0
        ),
      };
    case AppActions.SetOrdinals:
      return {
        ...state,
        ordinals: action.payload,
      };
    default:
      return state;
  }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [metamaskState] = useContext(MetaMaskContext);

  /// Network
  const [loading, setLoading] = useState<boolean>(false);

  const getCurrentNetwork = () => {
    setLoading(true);
    getNetworkInSnap()
      .then((network) => {
        dispatch({
          type: AppActions.SwitchNetwork,
          payload: network,
        });
        setLoading(false);
      })
      .catch((error) => {
        toast.error("Cannot get current network");
        console.error(error);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (metamaskState.installedSnap && !loading && !state.network) {
      getCurrentNetwork();
    }
  }, [metamaskState.installedSnap]);

  // Account
  const getSnapAccounts = async () => {
    return getAccounts().then((accounts) => {
      dispatch({
        type: AppActions.LoadAccounts,
        payload: accounts,
      });
    });
  };

  useEffect(() => {
    if (state.network) {
      getSnapAccounts();
    }
  }, [state.network]);

  // Balance
  useEffect(() => {
    if (state.network && state.accounts.length > 0) {
      Promise.all(
        state.accounts.map((account) => {
          return getBalance(account.address, state.network!);
        })
      )
        .then((balances) => {
          const result: BitcoinBalance = {};
          for (let index = 0; index < state.accounts.length; index++) {
            result[state.accounts[index].address] = balances[index];
          }
          dispatch({
            type: AppActions.SetBalance,
            payload: {
              balance: result,
              totalBalance: Object.values(balances).reduce(
                (acc, value) => acc + value,
                0
              ),
            },
          });
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }, [state.network, state.accounts.length]);

  // Utxo
  useEffect(() => {
    if (state.network && state.accounts.length > 0) {
      Promise.all(
        state.accounts.map((account) => {
          return getUtxo(account, state.network!);
        })
      )
        .then(async (utxo) => {
          const allUtxo = utxo.flat();
          const nonOrdUtxo: Utxo[] = [];
          const ordUtxo: OrdUtxoMap = {};

          for (const utxo of allUtxo) {
            const ordinalIds = await getOrdinalsFromUtxo(state.network!, utxo);
            if (ordinalIds.length === 0) {
              nonOrdUtxo.push(utxo);
            } else {
              for (const inscriptionId of ordinalIds) {
                ordUtxo[inscriptionId] = utxo;
              }
            }
          }

          dispatch({
            type: AppActions.SetUtxo,
            payload: {
              nonOrdUtxo,
              ordUtxo,
            },
          });
        })
        .catch((_) => {
          dispatch({
            type: AppActions.SetUtxo,
            payload: {
              nonOrdUtxo: [],
              ordUtxo: {},
            },
          });
          toast.error("Get utxo failed");
        });
    } else {
      dispatch({
        type: AppActions.SetUtxo,
        payload: {
          nonOrdUtxo: [],
          ordUtxo: {},
        },
      });
    }
  }, [state.network, state.accounts.length]);

  // Ordinal
  useEffect(() => {
    if (state.network && state.accounts.length > 0) {
      Promise.all(
        state.accounts.map((account) => {
          return getOrdinals(state.network!, account.address);
        })
      )
        .then((ordinals) => {
          dispatch({
            type: AppActions.SetOrdinals,
            payload: ordinals.flat(),
          });
        })
        .catch((_) => {
          dispatch({
            type: AppActions.SetOrdinals,
            payload: [],
          });
          toast.error("Get ordinals failed");
        });
    } else {
      dispatch({
        type: AppActions.SetOrdinals,
        payload: [],
      });
    }
  }, [state.network, state.accounts.length]);

  return (
    <AppContext.Provider value={[state, dispatch]}>
      {children}
    </AppContext.Provider>
  );
};
