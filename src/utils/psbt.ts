import {
  Psbt,
  networks,
  payments,
  script as bitcoinScript,
  Network,
  crypto,
} from "bitcoinjs-lib";
import { BitcoinNetwork, BitcoinScriptType } from "./interface";
import { Utxo } from "../mempool/utxo";
import { getTxRaw } from "../mempool/transaction";
import { toXOnly } from "./coin_manager";
import { detectNetworkAndScriptTypeByAddress } from "./bitcoin";

const OVERHEAD_VBYTE_SIZE = 12;

export const composePsbt = async (
  receiver: string,
  changeAddress: string,
  network: BitcoinNetwork,
  listUtxo: Utxo[],
  amount: number,
  fee: number
) => {
  const networkConfig =
    network === BitcoinNetwork.Main ? networks.bitcoin : networks.testnet;

  const psbt = new Psbt({ network: networkConfig });

  let totalUtxo = 0;
  let txSize = OVERHEAD_VBYTE_SIZE;

  for (const input of listUtxo) {
    totalUtxo += input.value;

    const rawHex = await getTxRaw(input.txid, network);
    const pubkey = Buffer.from(input.account.pubKey, "hex");

    const commonFields = {
      hash: input.txid,
      index: input.vout,
      nonWitnessUtxo: Buffer.from(rawHex, "hex"),
    };
    switch (input.account.scriptType) {
      case BitcoinScriptType.P2PKH:
        psbt.addInput({
          ...commonFields,
        });
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
        break;

      case BitcoinScriptType.P2TR:
        const xOnlyPubKey = toXOnly(pubkey);
        psbt.addInput({
          ...commonFields,
          witnessUtxo: {
            script: payments.p2tr({
              pubkey: xOnlyPubKey,
              network: networkConfig,
            }).output as Buffer,
            value: input.value,
          },
          tapInternalKey: xOnlyPubKey,
        });
        break;

      default:
        throw new Error("script Type not matched");
    }

    txSize += getTxSizeInputByScriptType(input.account.scriptType);
  }

  // Receiver
  const { scriptType } = detectNetworkAndScriptTypeByAddress(receiver);
  txSize += getTxSizeOutputByScriptType(scriptType);

  // Remainning return to changeAddress
  const { scriptType: scriptTypeChange } =
    detectNetworkAndScriptTypeByAddress(changeAddress);
  txSize += getTxSizeOutputByScriptType(scriptTypeChange);

  const finalFee = calculateFee(txSize, fee);

  if (totalUtxo >= amount + finalFee) {
    psbt.addOutput({
      address: receiver,
      value: amount,
    });

    psbt.addOutput({
      address: changeAddress,
      value: totalUtxo - amount - finalFee,
    });
  } else if (totalUtxo >= finalFee) {
    psbt.addOutput({
      address: receiver,
      value: totalUtxo - finalFee,
    });
  } else {
    throw new Error("Not enough balance");
  }

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
// https://medium.com/coinmonks/on-bitcoin-transaction-sizes-part-2-9445373d17f4#:~:text=Pay%2Dto%2DTaproot%20(P2TR,inputs%20also%20have%20fixed%20size.
const calculateFee = (txSize: number, fee: number) => {
  return txSize * fee;
};

const getTxSizeOutputByScriptType = (scriptType: BitcoinScriptType) => {
  switch (scriptType) {
    case BitcoinScriptType.P2PKH:
      return 34;
    case BitcoinScriptType.P2WPKH:
      return 31;
    case BitcoinScriptType.P2SH_P2WPKH:
      return 32;
    case BitcoinScriptType.P2TR:
      return 43;
    default:
      throw new Error("script Type not matched");
  }
};

const getTxSizeInputByScriptType = (scriptType: BitcoinScriptType) => {
  switch (scriptType) {
    case BitcoinScriptType.P2PKH:
      return 148;
    case BitcoinScriptType.P2WPKH:
      return 68;
    case BitcoinScriptType.P2SH_P2WPKH:
      return 91;
    case BitcoinScriptType.P2TR:
      return 41;
    default:
      throw new Error("script Type not matched");
  }
};
