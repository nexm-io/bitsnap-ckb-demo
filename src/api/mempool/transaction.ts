import { BitcoinNetwork } from "../../utils/interface";

export const getTxRaw = async (txid: string, network: BitcoinNetwork) => {
  const response = await fetch(
    network === BitcoinNetwork.Main
      ? `https://mempool.space/api/tx/${txid}/raw`
      : `https://mempool.space/testnet/api/tx/${txid}/raw`
  );

  if (response.ok) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    return Buffer.from(bytes).toString("hex");
  } else {
    return Promise.reject(new Error(`Unknown Error`));
  }
};

export const submitTx = async (txHex: string, network: BitcoinNetwork) => {
  const response = await fetch(
    network === BitcoinNetwork.Main
      ? `https://mempool.space/api/tx`
      : `https://mempool.space/testnet/api/tx`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: txHex,
    }
  );

  if (response.ok) {
    return true;
  } else {
    return Promise.reject(new Error(`Unknown Error`));
  }
};
