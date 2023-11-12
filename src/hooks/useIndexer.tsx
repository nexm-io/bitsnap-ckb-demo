import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AppContext } from "./AppContext";
import { Ordinal, getOrdinals } from "../api/xverse/wallet";

export const useIndexer = () => {
  const [state] = useContext(AppContext);
  const { network, accounts } = state;
  const [ordinals, setOrdinals] = useState<Ordinal[]>([]);

  useEffect(() => {
    if (network && accounts.length > 0) {
      Promise.all(
        accounts.map((account) => {
          return getOrdinals(network, account.address);
        })
      )
        .then((utxo) => {
          setOrdinals(utxo.flat());
        })
        .catch((_) => {
          setOrdinals([]);
          toast.error("Get ordinals failed");
        });
    } else {
      setOrdinals([]);
    }
  }, [network, accounts.length]);

  return {
    ordinals,
  };
};
