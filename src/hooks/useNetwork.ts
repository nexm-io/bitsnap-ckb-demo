import { useContext, useEffect, useState } from "react";
import { getNetworkInSnap, updateNetworkInSnap } from "../utils";
import { BitcoinNetwork } from "../utils/interface";
import { MetaMaskContext } from "./MetamaskContext";
import { toast } from "react-toastify";

export const useNetwork = () => {
  const [network, setNetwork] = useState<BitcoinNetwork | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [state] = useContext(MetaMaskContext);

  const getCurrentNetwork = () => {
    setLoading(true);
    getNetworkInSnap()
      .then((network) => {
        setNetwork(network);
        setLoading(false);
      })
      .catch((error) => {
        toast.error("Cannot get current network");
        console.error(error);
        setLoading(false);
      });
  };

  const switchNetwork = (network: BitcoinNetwork) => {
    updateNetworkInSnap(network).then(() => setNetwork(network));
  };

  useEffect(() => {
    if (state.installedSnap && !loading && !network) {
      getCurrentNetwork();
    }
  }, [state.installedSnap]);

  return {
    network,
    switchNetwork,
  };
};
