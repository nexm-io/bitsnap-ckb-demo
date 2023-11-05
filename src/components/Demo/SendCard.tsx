import {
  isLocalSnap,
  shouldDisplayReconnectButton,
  signPsbt,
} from "../../utils";
import { Button, Card } from "../../components";
import { useContext, useEffect, useState } from "react";
import { MetaMaskContext } from "../../hooks";
import { defaultSnapOrigin } from "../../config";
import { useAccount } from "../../hooks/useAccount";
import { bitToSat, satToBit } from "../../mempool/address";
import { composePsbt } from "../../utils/psbt";
import { validateTx } from "../../utils/psbtValidator";
import { getRecommendFees } from "../../mempool/fee";
import { useNetwork } from "../../hooks/useNetwork";
import { submitTx } from "../../mempool/transaction";
import { toast } from "react-toastify";

export const SendCard = () => {
  const [state] = useContext(MetaMaskContext);
  const [amount, setAmount] = useState<string>("0");
  const [receiver, setReceiver] = useState<string>("");
  const { connected, balance, connectToSnap, currentAccount } = useAccount();
  const { network } = useNetwork();
  const [fee, setFee] = useState(0);
  const [finalFee, setFinalFee] = useState(0);

  useEffect(() => {
    if (network) {
      getRecommendFees(network).then((fees) => setFee(fees.economyFee));
    }
  }, [network]);

  const isMetaMaskReady = isLocalSnap(defaultSnapOrigin)
    ? state.isFlask
    : state.snapsDetected;

  const handleUpdateAmount = (amountStr: string) => {
    const amountNum = parseFloat(amountStr);
    const bit = satToBit(balance);
    if (amountNum) {
      if (amountNum < 0) {
        setAmount("0");
      } else if (amountNum <= bit) {
        setAmount(amountNum.toString());
      } else {
        setAmount(bit.toString());
      }
    } else {
      setAmount(amountStr);
    }
  };

  const handleSendClick = async () => {
    if (currentAccount && receiver && network) {
      // Construct Tx
      const { psbt, finalFee } = await composePsbt(
        receiver,
        currentAccount,
        bitToSat(parseFloat(amount)),
        fee
      );

      if (
        !validateTx({
          psbt,
          utxoAmount: balance,
        })
      ) {
        throw Error("Transaction is not valid");
      }

      // Sign Tx
      setFinalFee(finalFee);

      const { txId, txHex } = await signPsbt(psbt.toBase64());

      // Submit Tx
      submitTx(txHex, network).then((result) => {
        if (result) {
          toast(`submit tx success: ${txId}`);
        }
      });
    }
  };

  const handleConnectClick = () => {
    connectToSnap();
  };

  return (
    <Card
      content={{
        title: "Send Coin",
        description: (
          <>
            <p>Send Amount (In BTC):</p>
            <input
              placeholder="Send Amount"
              value={amount}
              onChange={(event) => handleUpdateAmount(event.target.value)}
            />
            <p>Receiver Address:</p>
            <input
              placeholder="Receiver"
              value={receiver}
              onChange={(event) => setReceiver(event.target.value)}
            />
            <hr />
            <p>
              Fee Rate: <b>{fee}</b> sat/vB (Economy)
            </p>
            <p>
              Final Fee: <b>{satToBit(finalFee)}</b> BIT
            </p>
          </>
        ),
        button: (
          <>
            {connected ? (
              <Button
                onClick={() => handleSendClick()}
                disabled={amount === "0"}
              >
                Send BTC
              </Button>
            ) : (
              <Button onClick={() => handleConnectClick()}>
                Connect Account
              </Button>
            )}
          </>
        ),
      }}
      disabled={!state.installedSnap}
      fullWidth={
        isMetaMaskReady &&
        Boolean(state.installedSnap) &&
        !shouldDisplayReconnectButton(state.installedSnap)
      }
    />
  );
};
