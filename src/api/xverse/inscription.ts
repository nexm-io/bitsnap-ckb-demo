import { BitcoinNetwork } from "../../utils/interface";
import { Utxo } from "../mempool/utxo";
import memoized from "memoizee";

export const XVERSE_INSCRIBE_URL = (network: BitcoinNetwork) =>
  `https://inscribe${
    network === BitcoinNetwork.Main ? "" : "-testnet"
  }.xverse.app`;

export const getOrdinalsFromUtxo = memoized(getOrdinalIdsFromUtxo);

export async function getOrdinalIdsFromUtxo(
  network: BitcoinNetwork,
  utxo: Utxo
): Promise<string[]> {
  const ordinalContentUrl = `${XVERSE_INSCRIBE_URL(
    network
  )}/v1/inscriptions/utxo/${utxo.txid}/${utxo.vout}`;

  const response = await fetch(ordinalContentUrl);

  if (response.ok) {
    return (await response.json()) as string[];
  } else {
    return Promise.reject(new Error(`Unknown Error`));
  }
}
