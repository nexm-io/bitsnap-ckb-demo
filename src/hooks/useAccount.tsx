import { useContext, useEffect, useState } from "react";
import {
  BitcoinAccount,
  addAccount,
  connect,
  getAccounts,
  getCurrentAccount,
  isConnected,
  switchAccount,
} from "../utils";
import { BitcoinScriptType } from "../utils/interface";
import { useNetwork } from "./useNetwork";
import { MetaMaskContext, MetamaskActions } from "./MetamaskContext";
import { getBalance } from "../mempool/address";

export const useAccount = () => {
  const [accounts, setAccounts] = useState<BitcoinAccount[]>([]);
  const [currentAccount, setCurrentAccount] = useState<BitcoinAccount | null>(
    null
  );
  const { network } = useNetwork();
  const [_, dispatch] = useContext(MetaMaskContext);
  const [balance, setBalance] = useState<number>(0);
  const [connected, setConnected] = useState<boolean | null>(null);

  const getSnapAccounts = () => {
    getAccounts().then((accounts) => setAccounts(accounts));
  };

  const getCurrentSnapAccount = () => {
    getCurrentAccount().then((account) => setCurrentAccount(account));
  };

  const addSnapAccount = (scriptType: BitcoinScriptType) => {
    const maxIndex = accounts
      .filter((account) => account.scriptType === scriptType)
      .reduce((acc, account) => {
        return acc > account.index ? acc : account.index;
      }, 0);
    return addAccount(scriptType, maxIndex + 1).then((account) => {
      getSnapAccounts();
    });
  };

  const switchSnapAccount = (address: string) => {
    const account = accounts.find((account) => account.address === address);
    if (!account) {
      dispatch({
        type: MetamaskActions.SetError,
        payload: "Cannot find account",
      });
    } else {
      switchAccount(account.address, account.mfp).then((account) =>
        setCurrentAccount(account)
      );
    }
  };

  const checkConnected = (address: string) => {
    if (network) {
      return isConnected(address, network).then((connected) => {
        setConnected(connected);
      });
    }
  };

  const connectToSnap = () => {
    if (!connected && network && currentAccount && currentAccount.address) {
      connect(currentAccount.address, network).then((success) => {
        if (success) {
          setConnected(true);
        }
      });
    }
  };

  useEffect(() => {
    if (network) {
      getSnapAccounts();
      getCurrentSnapAccount();
    }
  }, [network]);

  useEffect(() => {
    if (network && currentAccount && currentAccount.address) {
      checkConnected(currentAccount.address);
      getBalance(currentAccount.address, network).then((balance) => {
        setBalance(balance);
      });
    }
  }, [network, currentAccount?.address]);

  return {
    accounts,
    getSnapAccounts,
    currentAccount,
    balance,
    connected,
    connectToSnap,
    getCurrentSnapAccount,
    addSnapAccount,
    switchSnapAccount,
  };
};
