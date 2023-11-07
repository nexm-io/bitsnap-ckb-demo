import { useEffect, useState } from "react";
import { useNetwork } from "./useNetwork";
import { getBalance } from "../mempool/address";
import { useAccount } from "./useAccount";

type BitcoinBalance = {
  [address: string]: number;
};

export const useBalance = () => {
  const { network } = useNetwork();
  const { accounts } = useAccount();
  const [balance, setBalance] = useState<BitcoinBalance>({});
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    if (network && accounts.length > 0) {
      Promise.all(
        accounts.map((account) => {
          return getBalance(account.address, network);
        })
      )
        .then((balances) => {
          const result: BitcoinBalance = {};
          for (let index = 0; index < accounts.length; index++) {
            result[accounts[index].address] = balances[index];
          }
          setBalance(result);

          setTotalBalance(
            Object.values(balances).reduce((acc, value) => acc + value, 0)
          );
        })
        .catch((_) => {
          setTotalBalance(0);
        });
    } else {
      setTotalBalance(0);
    }
  }, [network, accounts.length]);

  return {
    balance,
    totalBalance,
  };
};
