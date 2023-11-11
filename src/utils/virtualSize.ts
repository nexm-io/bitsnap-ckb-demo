import * as varuint from "bip174/src/lib/converter/varint";
import { BitcoinScriptType } from "./interface";

export type Input = {
  witness: Buffer[] | null;
  script: BitcoinScriptType;
};

export type Output = {
  script: BitcoinScriptType;
};

function varSliceSize(someScript: Buffer): number {
  const length = someScript.length;

  return varuint.encodingLength(length) + length;
}

function vectorSize(someVector: Buffer[]): number {
  const length = someVector.length;

  return (
    varuint.encodingLength(length) +
    someVector.reduce((sum, witness) => {
      return sum + varSliceSize(witness);
    }, 0)
  );
}

function getWitnessSize(input: Input): number {
  switch (input.script) {
    case BitcoinScriptType.P2WPKH:
    case BitcoinScriptType.P2SH_P2WPKH:
      // WITNESS STACK:
      // item count (1 byte)
      //   signature length (1 byte)
      //   signature (71 or 72 bytes)¹
      //   pubkey length (1 byte)
      //   pubkey (33 bytes)
      return 108;
    case BitcoinScriptType.P2TR:
      if (input.witness === null || input.witness.length === 0) {
        // Key Path Spend
        // WITNESS STACK:
        // item count (1 byte)
        // signature length (1 byte)
        // signature (64 bytes)
        return 66;
      } else {
        // Script Path Spend
        // WITNESS STACK:
        // item count (1 byte)
        //   script arguments (0–n)
        //     script argument length (1 byte)
        //     script argument (64 bytes for signatures, or variable)
        //   leaf script
        //     leaf script length (1 byte)
        //     leaf script (variable)
        //   Control Block
        //     CB length (1 byte)
        //     CB header (1 byte)
        //     hashing partners (32 bytes × CB depth)
        //     inner key (32 bytes)
        return 66 + vectorSize(input.witness);
      }
    default:
      throw new Error("script Type not matched");
  }
}

function getInputSize(script: BitcoinScriptType): number {
  // Each input commits to spending a specific UTXO by providing its transaction outpoint:
  // PREVOUT: hash (32 bytes)
  // index (4 bytes)
  // ---
  // The scriptsig for a P2TR input is empty, however, the scriptsig length must be provided as 0:
  // SCRIPTSIG: length (1 byte)
  // <no content>
  // ---
  // Each transaction input has its own sequence number:
  // sequence (4 bytes)
  switch (script) {
    case BitcoinScriptType.P2PKH:
      return 147.5;
    case BitcoinScriptType.P2WPKH:
      // 32 + 4 + 1 + 4 = 41
      return 41;
    case BitcoinScriptType.P2SH_P2WPKH:
      return 64;
    case BitcoinScriptType.P2TR:
      // 32 + 4 + 1 + 4 = 41
      return 41;
    default:
      throw new Error("script Type not matched");
  }
}

function getOutputSize(script: BitcoinScriptType): number {
  switch (script) {
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
}

function weight(ins: Input[], outs: Output[]): number {
  const base = byteLength(ins, outs, false);
  const total = byteLength(ins, outs, true);
  return base * 3 + total;
}

function hasWitnesses(ins: Input[]): boolean {
  return ins.some((x) => {
    return x.witness !== null;
  });
}

function byteLength(
  ins: Input[],
  outs: Output[],
  _ALLOW_WITNESS: boolean = true
): number {
  const _hasWitnesses = _ALLOW_WITNESS && hasWitnesses(ins);

  return (
    (_hasWitnesses ? 10 : 8) +
    ins.length +
    outs.length +
    ins.reduce((sum, input) => {
      return sum + getInputSize(input.script);
    }, 0) +
    outs.reduce((sum, output) => {
      return sum + getOutputSize(output.script);
    }, 0) +
    (_hasWitnesses
      ? ins.reduce((sum, input) => {
          return sum + getWitnessSize(input);
        }, 0)
      : 0)
  );
}

export function virtualSize(ins: Input[], outs: Output[]) {
  return Math.ceil(weight(ins, outs) / 4);
}
