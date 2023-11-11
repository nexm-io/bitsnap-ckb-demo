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
import { Input, virtualSize } from "./virtualSize";
import { detectNetworkAndScriptTypeByAddress } from "./bitcoin";

export const composeSendPsbt = async (
  receiver: string,
  changeAddress: string,
  network: BitcoinNetwork,
  listUtxo: Utxo[],
  amount: number,
  feeRate: number
) => {
  const networkConfig =
    network === BitcoinNetwork.Main ? networks.bitcoin : networks.testnet;

  const psbt = new Psbt({ network: networkConfig });

  let totalUtxo = 0;
  const inputs: Input[] = [];

  for (const input of listUtxo) {
    totalUtxo += input.value;

    const pubkey = Buffer.from(input.account.pubKey, "hex");
    const commonFields = {
      hash: input.txid,
      index: input.vout,
    };
    switch (input.account.scriptType) {
      case BitcoinScriptType.P2PKH:
        const rawHex = await getTxRaw(input.txid, network);
        psbt.addInput({
          ...commonFields,
          nonWitnessUtxo: Buffer.from(rawHex, "hex"),
        });

        // For calculate tx size
        inputs.push({
          witness: null,
          script: input.account.scriptType,
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

        // For calculate tx size
        inputs.push({
          witness: [],
          script: input.account.scriptType,
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

        // For calculate tx size
        inputs.push({
          witness: [],
          script: input.account.scriptType,
        });
        break;

      case BitcoinScriptType.P2TR:
        // Key Path Spending
        const xOnlyPubKey = toXOnly(pubkey);
        psbt.addInput({
          ...commonFields,
          witnessUtxo: {
            script: payments.p2tr({
              internalPubkey: xOnlyPubKey,
              network: networkConfig,
            }).output as Buffer,
            value: input.value,
          },
          tapInternalKey: xOnlyPubKey,
        });

        // For calculate tx size (Only P2TR Key-path)
        inputs.push({
          witness: [],
          script: input.account.scriptType,
        });
        break;

      default:
        throw new Error("script Type not matched");
    }
  }

  // Calculate fee with 2 outputs
  const outputs = [receiver, changeAddress].map((address) => {
    return {
      script: detectNetworkAndScriptTypeByAddress(address).scriptType,
    };
  });
  const txvBytes = virtualSize(inputs, outputs);
  let finalFee = txvBytes * feeRate;

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
    // Re-calculate finalFee because the output has reduce from 2 to 1
    const txvBytes = virtualSize(inputs, outputs.slice(0, 1));
    finalFee = txvBytes * feeRate;

    psbt.addOutput({
      address: receiver,
      value: totalUtxo - finalFee,
    });
  } else {
    throw new Error("Not enough balance");
  }

  return { psbt, finalFee };
};

export const calculateScript = (publicKey: Buffer, network: Network) => {
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

export const compileScript = (script: Buffer) => {
  return bitcoinScript.compile([
    bitcoinScript.OPS.OP_HASH160,
    crypto.hash160(script),
    bitcoinScript.OPS.OP_EQUAL,
  ]);
};
