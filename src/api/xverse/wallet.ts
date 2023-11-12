import { BitcoinNetwork } from "../../utils/interface";

export type Ordinal = {
  id: string;
  content_type: string;
  number: number;
};

export const getOrdinalContent = (network: BitcoinNetwork, ordinalId: string) =>
  `https://ord${
    network === BitcoinNetwork.Main ? "" : "-testnet"
  }.xverse.app/content/${ordinalId}`;

export const getOrdinals = async (network: BitcoinNetwork, address: string) => {
  const origin = `https://api${
    network === BitcoinNetwork.Main ? "" : "-testnet"
  }.xverse.app/v1/address/${address}/ordinals/collections?`;

  const response = await fetch(
    origin +
      new URLSearchParams({
        offset: "0",
        limit: "100",
      })
  );

  if (response.ok) {
    return (await response.json()).results
      .map((result: any) => result.thumbnail_inscriptions)
      .flat() as Ordinal[];
  } else {
    return Promise.reject(new Error(`Unknown Error`));
  }
};
