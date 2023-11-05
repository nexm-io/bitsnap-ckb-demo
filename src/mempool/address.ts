import { BitcoinNetwork } from "../utils/interface";

const BITCOIN_DECIMAL = 8;

export const getBalance = async (address: string, network: BitcoinNetwork) => {
  try {
    const response = await fetch(
      network === BitcoinNetwork.Main
        ? `https://mempool.space/api/address/${address}`
        : `https://mempool.space/testnet/api/address/${address}`
    );

    if (response.ok) {
      const { chain_stats } = await response.json();
      // Bitcoin Decimal = 8
      if (chain_stats && chain_stats.funded_txo_sum !== undefined) {
        return chain_stats.funded_txo_sum as number;
      } else {
        return Promise.reject(new Error(`Cannot parse data`));
      }
    } else {
      return Promise.reject(new Error(`Unknown Error`));
    }
  } catch (error) {
    console.log(error);
    return 0;
  }
};

export const satToBit = (sat: number): number => {
  return sat / Math.pow(10, BITCOIN_DECIMAL);
};

export const bitToSat = (bit: number): number => {
  return Math.round(bit * Math.pow(10, BITCOIN_DECIMAL));
};
