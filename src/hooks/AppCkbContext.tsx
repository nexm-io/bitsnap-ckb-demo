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
import { CkbNetwork } from "../utils/interface";
import { CkbAccount, getCkbAccounts, getCkbNetworkInSnap } from "../utils";
import { toast } from "react-toastify";
import { MetaMaskContext } from "./MetamaskContext";
import { capacityOf } from "../utils/ckb/lib";
import { BI } from "@ckb-lumos/lumos";

export type CkbBalance = {
  [address: string]: BI;
};

type NetworkState = {
  network: CkbNetwork | null;
};

type AccountState = {
  accounts: CkbAccount[];
};

type BalanceState = {
  balance: CkbBalance;
  totalBalance: number;
};

const initialState: AppState = {
  // network
  network: null,
  // accounts
  accounts: [],
  // balance
  balance: {},
  totalBalance: 0,
};

type AppState = NetworkState & AccountState & BalanceState;
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
    getCkbNetworkInSnap()
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
    return getCkbAccounts().then((accounts) => {
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
          return capacityOf(account.address);
        })
      )
        .then((balances) => {
          const result: CkbBalance = {};
          for (let index = 0; index < state.accounts.length; index++) {
            result[state.accounts[index].address] = balances[index];
          }
          dispatch({
            type: AppActions.SetBalance,
            payload: {
              balance: result,
              totalBalance: Object.values(balances).reduce(
                (acc, value) => acc.add(value),
                BI.from(0)
              ),
            },
          });
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }, [state.network, state.accounts.length]);

  return (
    <AppContext.Provider value={[state, dispatch]}>
      {children}
    </AppContext.Provider>
  );
};
