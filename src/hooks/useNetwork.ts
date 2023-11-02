import { useEffect, useState } from 'react';
import { getNetworkInSnap, updateNetworkInSnap } from '../utils';
import { BitcoinNetwork, BitcoinScriptType } from '../utils/interface';
import { useAppStore } from '../mobx';

export const useNetwork = () => {
  const {
    current,
    persistDataLoaded,
    settings: {
      network: networkConfig,
      setNetwork: setNetworkConfig,
      scriptType,
    },
    switchToAccount,
  } = useAppStore();
  const [network, setNetwork] = useState(networkConfig);
  const [isSettingNetwork, setIsSettingNetwork] = useState<boolean>(false);

  const switchNetwork = async (netValue: BitcoinNetwork) => {
    const targetNetwork = await updateNetworkInSnap(netValue);

    if (targetNetwork) {
      setNetworkConfig(netValue);
      setNetwork(netValue);
      current && switchToAccount(current.mfp, scriptType, netValue);
    }
  };

  const switchNetworkSettingAndUpdateState = (
    targetNetwork: BitcoinNetwork,
  ) => {
    setNetworkConfig(targetNetwork);
    setNetwork(targetNetwork);
    current && switchToAccount(current.mfp, current.scriptType, targetNetwork);
  };

  useEffect(() => {
    if (!persistDataLoaded) {
      return;
    }

    if (current) {
      getNetworkInSnap().then((network) => {
        if (network === '') {
          setIsSettingNetwork(true);
          updateNetworkInSnap(current.network).then(() => {
            setIsSettingNetwork(false);
          });
        } else {
          const networkInSnap =
            network === 'test' ? BitcoinNetwork.Test : BitcoinNetwork.Main;
          const isNetworkTheSame = networkInSnap === current.network;
          if (!isNetworkTheSame) {
            switchNetworkSettingAndUpdateState(networkInSnap);
          }
        }
      });
    }
  }, [persistDataLoaded, current]);

  return {
    network,
    isSettingNetwork,
    switchNetwork,
  };
};
