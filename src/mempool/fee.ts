import { BitcoinNetwork } from "../utils/interface";

export type RecommendedFees = {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
};

export const getRecommendFees = async (network: BitcoinNetwork) => {
  const response = await fetch(
    network === BitcoinNetwork.Main
      ? `https://mempool.space/api/v1/fees/recommended`
      : `https://mempool.space/testnet/api/v1/fees/recommended`
  );

  if (response.ok) {
    return (await response.json()) as RecommendedFees;
  } else {
    return Promise.reject(new Error(`Unknown Error`));
  }
};
