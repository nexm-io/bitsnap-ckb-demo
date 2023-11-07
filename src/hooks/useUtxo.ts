import { useEffect, useMemo, useState } from "react";
import { useNetwork } from "./useNetwork";
import { useAccount } from "./useAccount";
import { Utxo, getUtxo } from "../mempool/utxo";
import { toast } from "react-toastify";

export const useUtxo = () => {
  const { network } = useNetwork();
  const { accounts } = useAccount();
  const [listUtxo, setListUtxo] = useState<Utxo[]>([]);
  const [selected, setSelected] = useState<Utxo[]>([]);

  const totalUtxoValue = useMemo(() => {
    return selected.reduce((acc, value) => acc + value.value, 0);
  }, [selected.length]);

  useEffect(() => {
    if (network && accounts.length > 0) {
      Promise.all(
        accounts.map((account) => {
          return getUtxo(account, network);
        })
      )
        .then((utxo) => {
          setListUtxo(utxo.flat());
        })
        .catch((_) => {
          setListUtxo([]);
          toast.error("Get utxo failed");
        });
    } else {
      setListUtxo([]);
    }
  }, [network, accounts.length]);

  return {
    listUtxo,
    // Select for incoming tx
    totalUtxoValue,
    selected,
    setSelected,
  };
};
