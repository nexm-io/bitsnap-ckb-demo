import { Psbt } from "bitcoinjs-lib";

const MAX_FEE = 0.1 * 100000000;
export const DUST_THRESHOLD = 546;

interface ValidateTxData {
  psbt: Psbt;
  utxoAmount: number;
}

export const validateTx = ({ psbt, utxoAmount }: ValidateTxData) => {
  return !isFeeTooHigh(psbt, utxoAmount) && !hasDustOutput(psbt);
};

const isFeeTooHigh = (psbt: Psbt, utxoAmount: number) => {
  const outputAmount = psbt.txOutputs.reduce(
    (amount, output) => amount + output.value,
    0
  );
  const fee = utxoAmount - outputAmount;
  return fee >= MAX_FEE;
};

const hasDustOutput = (psbt: Psbt) => {
  return !!psbt.txOutputs.find((output) => output.value <= DUST_THRESHOLD);
};
