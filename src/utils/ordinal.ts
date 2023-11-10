import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";
import {
  initEccLib,
  script,
  opcodes,
  networks,
  Psbt,
  payments,
  Payment,
} from "bitcoinjs-lib";
import { Tapleaf, Taptree } from "bitcoinjs-lib/src/types";
import { BitcoinNetwork, BitcoinScriptType } from "./interface";
import { Utxo, getUtxoByAddress } from "../mempool/utxo";
import { getTxRaw } from "../mempool/transaction";
import { toXOnly } from "./coin_manager";
import {
  LEAF_VERSION_TAPSCRIPT,
  tweakKey,
} from "bitcoinjs-lib/src/payments/bip341";
import {
  OVERHEAD_VBYTE_SIZE,
  POSTAGE,
  calculateFee,
  getTxSizeInputByScriptType,
  getTxSizeOutputByScriptType,
} from "./psbt";

// Maximum number of bytes pushable to the witness stack
const MAXIMUM_SCRIPT_ELEMENT_SIZE = 520;

export const SupportedMediaTypes: MediaType[] = [
  "text/plain",
  "image/jpeg",
  "image/png",
  "video/mp4",
];

// Must be utf8 encode
type Text = "text/plain;charset=utf-8";
// Must be base64 encode
type Image = "image/jpeg" | "image/png";
type Video = "video/mp4";
export type MediaType = Text | Image | Video;

export type WitnessScriptOptions = {
  xkey: Buffer;
  mediaContent: string;
  mediaType: MediaType;
  meta: any;
};

function opPush(data: string | Buffer) {
  const buff = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf8");
  if (buff.byteLength > MAXIMUM_SCRIPT_ELEMENT_SIZE)
    throw new Error(
      "Data is too large to push. Use chunkContent to split data into smaller chunks"
    );

  return Buffer.concat([buff]);
}

const chunkContent = function (str: string, encoding: BufferEncoding = "utf8") {
  const contentBuffer = Buffer.from(str, encoding);
  const chunks: Buffer[] = [];
  let chunkedBytes = 0;

  while (chunkedBytes < contentBuffer.byteLength) {
    const chunk = contentBuffer.subarray(
      chunkedBytes,
      chunkedBytes + MAXIMUM_SCRIPT_ELEMENT_SIZE
    );
    chunkedBytes += chunk.byteLength;
    chunks.push(chunk);
  }

  return chunks;
};

export function buildRecoveryScript(xkey: Buffer): Tapleaf {
  return { output: script.compile([xkey, opcodes.OP_CHECKSIG]) };
}

export function buildWitnessScript({
  ...options
}: WitnessScriptOptions): Tapleaf {
  initEccLib(ecc);
  if (!options.mediaType || !options.mediaContent || !options.xkey) {
    throw new Error("Failed to build witness script");
  }

  // Chunk content
  // MediaType = text
  // => encode as utf8
  // ---
  // MediaType not text
  // => encode as base64
  const contentChunks = chunkContent(
    options.mediaContent,
    !options.mediaType.includes("text") ? "base64" : "utf8"
  );
  const contentStackElements = contentChunks.map(opPush);
  const metaStackElements: (number | Buffer)[] = [];

  // Flexible Object
  // Can be any - Additional data which is stored as addtional information
  if (options.meta && typeof options.meta === "object") {
    metaStackElements.push(
      ...[
        opcodes.OP_FALSE,
        opcodes.OP_IF,
        opPush("ord"),
        1,
        1,
        opPush("application/json;charset=utf-8"),
        opcodes.OP_0,
      ]
    );
    const metaChunks = chunkContent(JSON.stringify(options.meta));

    metaChunks &&
      metaChunks.forEach((chunk) => {
        metaStackElements.push(opPush(chunk));
      });
    metaChunks && metaStackElements.push(opcodes.OP_ENDIF);
  }

  const baseStackElements = [
    options.xkey,
    opcodes.OP_CHECKSIG,
    opcodes.OP_FALSE,
    opcodes.OP_IF,
    opPush("ord"),
    1,
    1,
    opPush(options.mediaType),
    opcodes.OP_0,
  ];

  return {
    output: script.compile([
      ...baseStackElements,
      ...contentStackElements,
      opcodes.OP_ENDIF,
      ...metaStackElements,
    ]),
  };
}

export function buildInscriptionScript(
  ownerPubkey: Buffer,
  mediaContent: string,
  mediaType: MediaType,
  meta: Record<string, any> | null,
  network: BitcoinNetwork
) {
  const networkConfig =
    network === BitcoinNetwork.Main ? networks.bitcoin : networks.testnet;
  const xOnlyPubKey = toXOnly(ownerPubkey);
  const tweakedPubKey = tweakKey(xOnlyPubKey, undefined)!.x;

  // build taproot tree (witness scripts)
  const inscription = buildWitnessScript({
    mediaContent: mediaContent,
    mediaType: mediaType,
    meta: meta,
    xkey: tweakedPubKey,
  });

  // Tree contains - 2 Leaf
  // 1 Inscription (Pubkey + Data)
  // 1 Pubkey - OP_CHECKSIG
  // https://www.oips.io/oip-03-recoverable-commits
  const taprootTree: Taptree = [
    inscription,
    buildRecoveryScript(tweakedPubKey),
  ];

  // build witness script
  // https://github.com/bitcoinjs/bitcoinjs-lib/pull/1742
  const witnessScript = payments.p2tr({
    internalPubkey: xOnlyPubKey,
    network: networkConfig,
    scriptTree: taprootTree,
    redeem: {
      output: inscription.output,
      redeemVersion: LEAF_VERSION_TAPSCRIPT,
    },
  });

  return witnessScript;
}

// Ord will output two transactions IDs, one for the commit transaction, and one for the reveal transaction, and the inscription ID.
// Inscription IDs are of the form TXIDiN, where TXID is the transaction ID of the reveal transaction,
// and N is the index of the inscription in the reveal transaction.
export async function commitInscription(
  commitAddress: string,
  changeAddress: string,
  network: BitcoinNetwork,
  spenderUtxo: Utxo,
  fee: number
) {
  const networkConfig =
    network === BitcoinNetwork.Main ? networks.bitcoin : networks.testnet;

  const psbt = new Psbt({ network: networkConfig });

  const rawHex = await getTxRaw(spenderUtxo.txid, network);
  const pubkey = Buffer.from(spenderUtxo.account.pubKey, "hex");
  const xOnlyPubKey = toXOnly(pubkey);

  // 1. Commit Step - transfer postage to this commit address
  let txSize = OVERHEAD_VBYTE_SIZE;

  // build input
  psbt.addInput({
    hash: spenderUtxo.txid,
    index: spenderUtxo.vout,
    nonWitnessUtxo: Buffer.from(rawHex, "hex"),
    witnessUtxo: {
      script: payments.p2tr({
        internalPubkey: xOnlyPubKey,
        network: networkConfig,
      }).output as Buffer,
      value: spenderUtxo.value,
    },
    tapInternalKey: xOnlyPubKey,
  });

  psbt.addOutput({
    address: commitAddress,
    value: POSTAGE, // postage: base value of the inscription in sats
  });

  txSize += getTxSizeInputByScriptType(BitcoinScriptType.P2TR);
  txSize += 2 * getTxSizeOutputByScriptType(BitcoinScriptType.P2TR);
  // TODO: change this
  txSize += 58; // donot know why :(

  const finalFee = calculateFee(txSize, fee);

  psbt.addOutput({
    address: changeAddress,
    value: spenderUtxo.value - POSTAGE - finalFee,
  });

  return { psbt, finalFee };
}

export async function revealInscription(
  ownerPubkey: Buffer,
  changeAddress: string,
  network: BitcoinNetwork,
  inscriptScript: Payment,
  fee: number
) {
  const xOnlyPubKey = toXOnly(ownerPubkey);
  const networkConfig =
    network === BitcoinNetwork.Main ? networks.bitcoin : networks.testnet;
  const psbt = new Psbt({ network: networkConfig });
  const commitUtxo = await getUtxoByAddress(inscriptScript.address!, network);

  // TODO: should get compatible commited utxo with this script instead of get first utxo
  const availableCommitUtxo = commitUtxo[0];
  const rawHex = await getTxRaw(availableCommitUtxo.txid, network);

  // 2. Reveal step
  // build input
  let txSize = OVERHEAD_VBYTE_SIZE;
  psbt.addInput({
    hash: availableCommitUtxo.txid,
    index: availableCommitUtxo.vout,
    nonWitnessUtxo: Buffer.from(rawHex, "hex"),
    witnessUtxo: {
      script: inscriptScript.output!,
      value: availableCommitUtxo.value,
    },
    tapInternalKey: xOnlyPubKey,
    tapLeafScript: [
      {
        leafVersion: LEAF_VERSION_TAPSCRIPT,
        script: inscriptScript.redeem!.output!,
        controlBlock:
          inscriptScript.witness![inscriptScript.witness!.length - 1],
      },
    ],
  });

  txSize += getTxSizeInputByScriptType(BitcoinScriptType.P2TR);

  // Remainning return to changeAddress
  txSize += getTxSizeOutputByScriptType(BitcoinScriptType.P2TR);

  // TODO: change this
  txSize += 58; // donot know why :(

  const finalFee = calculateFee(txSize, fee);

  if (availableCommitUtxo.value >= finalFee) {
    psbt.addOutput({
      address: changeAddress,
      value: availableCommitUtxo.value - finalFee,
    });
  } else {
    throw new Error("Not enough balance");
  }

  return { psbt, finalFee };
}
