import { useContext, useEffect, useState } from "react";
import { getNetworkInSnap, updateNetworkInSnap } from "../utils";
import { BitcoinNetwork } from "../utils/interface";
import { MetaMaskContext } from "./MetamaskContext";

export const useNetwork = () => {
  const [network, setNetwork] = useState<BitcoinNetwork | null>(null);
  const [state] = useContext(MetaMaskContext);

  const getCurrentNetwork = () => {
    getNetworkInSnap().then((network) => {
      switch (network) {
        case "test":
          setNetwork(BitcoinNetwork.Test);
          break;
        case "main":
          setNetwork(BitcoinNetwork.Main);
          break;

        default:
          console.error("Unknown network", network);
          break;
      }
    });
  };

  const switchNetwork = (network: BitcoinNetwork) => {
    updateNetworkInSnap(network).then(() => setNetwork(network));
  };

  useEffect(() => {
    if (state.installedSnap) {
      getCurrentNetwork();
    }
  }, [state.installedSnap]);

  return {
    network,
    switchNetwork,
  };
};
