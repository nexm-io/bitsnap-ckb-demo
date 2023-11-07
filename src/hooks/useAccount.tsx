import { useCallback, useEffect, useState } from "react";
import { BitcoinAccount, addAccount, getAccounts } from "../utils";
import { BitcoinScriptType } from "../utils/interface";
import { useNetwork } from "./useNetwork";

export const useAccount = () => {
  const [accounts, setAccounts] = useState<BitcoinAccount[]>([]);
  const { network } = useNetwork();

  const getSnapAccounts = useCallback(() => {
    getAccounts().then((accounts) => setAccounts(accounts));
  }, [network]);

  const addSnapAccount = (scriptType: BitcoinScriptType) => {
    addAccount(scriptType).then((account) => {
      if (account) {
        setAccounts([...accounts, account]);
      }
    });
  };

  useEffect(() => {
    if (network) {
      getSnapAccounts();
    }
  }, [network]);

  return {
    accounts,
    getSnapAccounts,
    addSnapAccount,
  };
};
