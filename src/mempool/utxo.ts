import { BitcoinAccount } from "../utils";
import { BitcoinNetwork } from "../utils/interface";

type MempoolUtxoResponse = {
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

export type Utxo = MempoolUtxoResponse & { account: BitcoinAccount };

export const getUtxo = async (
  account: BitcoinAccount,
  network: BitcoinNetwork
) => {
  try {
    const response = await fetch(
      network === BitcoinNetwork.Main
        ? `https://mempool.space/api/address/${account.address}/utxo`
        : `https://mempool.space/testnet/api/address/${account.address}/utxo`
    );

    if (response.ok) {
      return (await response.json()).map((utxo: MempoolUtxoResponse) => {
        return {
          ...utxo,
          account,
        };
      }) as Utxo[];
    } else {
      return Promise.reject(new Error(`Unknown Error`));
    }
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getUtxoByAddress = async (
  address: string,
  network: BitcoinNetwork
) => {
  try {
    const response = await fetch(
      network === BitcoinNetwork.Main
        ? `https://mempool.space/api/address/${address}/utxo`
        : `https://mempool.space/testnet/api/address/${address}/utxo`
    );

    if (response.ok) {
      return (await response.json()).map((utxo: MempoolUtxoResponse) => {
        return {
          ...utxo,
        };
      }) as MempoolUtxoResponse[];
    } else {
      return Promise.reject(new Error(`Unknown Error`));
    }
  } catch (error) {
    console.log(error);
    return [];
  }
};
