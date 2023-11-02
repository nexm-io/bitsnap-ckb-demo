import { useState, useEffect } from 'react';
import { getMasterFingerprint } from '../utils';
import { useAppStore } from '../mobx';

export const useMFPCheck = () => {
  const { current, persistDataLoaded } = useAppStore();
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [isSameMFP, setIsSameMFP] = useState<boolean>(false);

  useEffect(() => {
    if (!persistDataLoaded) {
      return;
    }

    if (current) {
      setIsChecking(true);
      getMasterFingerprint().then((mfp) => {
        setIsSameMFP(current.mfp === mfp);
        setIsChecking(false);
      });
    }
  }, [persistDataLoaded, current]);

  return {
    isChecking,
    isSameMFP,
  };
};
