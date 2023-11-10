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
import { getBalance } from "../mempool/address";
import { MetaMaskContext } from "./MetamaskContext";
import { Utxo, getUtxo } from "../mempool/utxo";

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

type UtxoState = {
  listUtxo: Utxo[];
  selectedUtxo: Utxo[];
  totalUtxoValue: number;
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
  listUtxo: [],
  selectedUtxo: [],
  totalUtxoValue: 0,
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
  SetListUtxo = "SetListUtxo",
  SelectUtxo = "SelectUtxo",
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
    case AppActions.SetListUtxo:
      return {
        ...state,
        listUtxo: action.payload,
      };
    case AppActions.SelectUtxo:
      const index: number = action.payload;
      const { selectedUtxo, listUtxo } = state;
      let newSelectedUtxo: Utxo[] = [];
      if (
        selectedUtxo.findIndex(
          (utxo) =>
            utxo.txid === listUtxo[index].txid &&
            utxo.vout === listUtxo[index].vout
        ) === -1
      ) {
        newSelectedUtxo = [...selectedUtxo, listUtxo[index]];
      } else {
        newSelectedUtxo = selectedUtxo.filter(
          (utxo) =>
            utxo.txid !== listUtxo[index].txid ||
            utxo.vout !== listUtxo[index].vout
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

  useEffect(() => {
    if (state.network && state.accounts.length > 0) {
      Promise.all(
        state.accounts.map((account) => {
          return getUtxo(account, state.network!);
        })
      )
        .then((utxo) => {
          dispatch({
            type: AppActions.SetListUtxo,
            payload: utxo.flat(),
          });
        })
        .catch((_) => {
          dispatch({
            type: AppActions.SetListUtxo,
            payload: [],
          });
          toast.error("Get utxo failed");
        });
    } else {
      dispatch({
        type: AppActions.SetListUtxo,
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
