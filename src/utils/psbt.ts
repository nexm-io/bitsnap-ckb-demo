import {
  Psbt,
  networks,
  payments,
  script as bitcoinScript,
  Network,
  crypto,
} from "bitcoinjs-lib";
import { BitcoinNetwork, BitcoinScriptType } from "./interface";
import { getUtxo } from "../mempool/utxo";
import { BitcoinAccount } from "./snap";
import { getTxRaw } from "../mempool/transaction";

export const composePsbt = async (
  receiver: string,
  sender: BitcoinAccount,
  amount: number,
  fee: number
) => {
  const networkConfig =
    sender.network === "main" ? networks.bitcoin : networks.testnet;
  const bitcoinNetwork =
    sender.network === "main" ? BitcoinNetwork.Main : BitcoinNetwork.Test;

  const psbt = new Psbt({ network: networkConfig });
  const listUtxo = await getUtxo(sender.address, bitcoinNetwork);
  if (!listUtxo) throw new Error("Utxo selections error please retry");

  const pubkey = Buffer.from(sender.pubKey, "hex");

  let totalUtxo = 0;
  let txSize = 10; // overhead
  for (const input of listUtxo) {
    totalUtxo += input.value;
    const rawHex = await getTxRaw(input.txid, bitcoinNetwork);
    const commonFields = {
      hash: input.txid,
      index: input.vout,
      nonWitnessUtxo: Buffer.from(rawHex, "hex"),
    };
    switch (sender.scriptType) {
      case BitcoinScriptType.P2PKH:
        psbt.addInput({
          ...commonFields,
        });
        txSize += 148;
        break;

      case BitcoinScriptType.P2WPKH:
        psbt.addInput({
          ...commonFields,
          witnessUtxo: {
            script: payments.p2wpkh({
              pubkey,
              network: networkConfig,
            }).output as Buffer,
            value: input.value,
          },
        });
        txSize += 68;
        break;

      case BitcoinScriptType.P2SH_P2WPKH:
        psbt.addInput({
          ...commonFields,
          witnessUtxo: {
            script: calculateScript(pubkey, networkConfig),
            value: input.value,
          },
          redeemScript: payments.p2wpkh({
            pubkey,
            network: networkConfig,
          }).output,
        });
        txSize += 91;
        break;

      default:
        throw new Error("script Type not matched");
    }
  }

  // TODO: check receiver script type
  txSize += 34;
  psbt.addOutput({
    address: receiver,
    value: amount,
  });

  // Remainning return to spender
  switch (sender.scriptType) {
    case BitcoinScriptType.P2PKH:
      txSize += 34;
      break;
    case BitcoinScriptType.P2WPKH:
      txSize += 31;
      break;
    case BitcoinScriptType.P2SH_P2WPKH:
      txSize += 32;
      break;
    default:
      throw new Error("script Type not matched");
  }
  const finalFee = calculateFee(txSize, fee);
  psbt.addOutput({
    address: sender.address,
    value: totalUtxo - amount - finalFee,
  });

  return { psbt, finalFee };
};

const calculateScript = (publicKey: Buffer, network: Network) => {
  const p2wpkh = payments.p2wpkh({
    pubkey: publicKey,
    network,
  });

  const p2sh = payments.p2sh({
    redeem: p2wpkh,
    network: network,
  }) as any;

  const script = compileScript(p2sh.redeem.output);

  return script;
};

const compileScript = (script: Buffer) => {
  return bitcoinScript.compile([
    bitcoinScript.OPS.OP_HASH160,
    crypto.hash160(script),
    bitcoinScript.OPS.OP_EQUAL,
  ]);
};

// https://i.stack.imgur.com/1iDzo.png
// https://blockchain-academy.hs-mittweida.de/2023/02/calculation-of-bitcoin-transaction-fees-explained/
// https://bitcoin.stackexchange.com/questions/84004/how-do-virtual-size-stripped-size-and-raw-size-compare-between-legacy-address-f
const calculateFee = (txSize: number, fee: number) => {
  return txSize * fee;
};
