import { BitcoinNetwork } from "../utils/interface";

const DECIMAL_DENOMINATOR = 100000000;

export const getBalance = async (address: string, network: BitcoinNetwork) => {
  const response = await fetch(
    `https://mempool.space/${network}/api/address/${address}`
  );

  const { chain_stats } = await response.json();

  if (response.ok) {
    // Bitcoin Decimal = 8
    if (chain_stats && chain_stats.funded_txo_sum !== undefined) {
      return chain_stats.funded_txo_sum as number;
    } else {
      return Promise.reject(new Error(`Cannot parse data`));
    }
  } else {
    return Promise.reject(new Error(`Unknown Error`));
  }
};

export const satToBit = (balance: number): number => {
  return balance / DECIMAL_DENOMINATOR;
};
