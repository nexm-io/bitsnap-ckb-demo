import { useEffect, useState } from 'react';
import { IAccount } from '../mobx/types';
import { useAppStore } from '../mobx';

export const useAddress = () => {
  const { current } = useAppStore();
  const [address, setAddress] = useState<string>('');
  const [path, setPath] = useState<string>('');

  const setReceiveAddress = (current: IAccount) => {
    const receiveAddress = current.receiveAddress;
    setAddress(receiveAddress.address);
    setPath(`M/0/${receiveAddress.index}`);
  };

  useEffect(() => {
    console.log('current', current);
    if (current) {
      setReceiveAddress(current);
    } else {
      setAddress('');
      setPath('');
    }
  }, [current]);

  return {
    address,
    path,
  };
};
