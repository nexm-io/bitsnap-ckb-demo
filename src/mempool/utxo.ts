import { BitcoinNetwork } from "../utils/interface";

export type Utxo = {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
  value: number;
};

export const getUtxo = async (address: string, network: BitcoinNetwork) => {
  try {
    const response = await fetch(
      network === BitcoinNetwork.Main
        ? `https://mempool.space/api/address/${address}/utxo`
        : `https://mempool.space/testnet/api/address/${address}/utxo`
    );

    if (response.ok) {
      return (await response.json()) as Utxo[];
    } else {
      return Promise.reject(new Error(`Unknown Error`));
    }
  } catch (error) {
    console.log(error);
    return [];
  }
};
