import { isLocalSnap, shouldDisplayReconnectButton } from "../../utils";
import { Button, Card } from "../../components";
import { useContext, useState } from "react";
import { MetaMaskContext } from "../../hooks";
import { defaultSnapOrigin } from "../../config";
import { useAccount } from "../../hooks/useAccount";

export const SendCard = () => {
  const [state] = useContext(MetaMaskContext);
  const [amount, setAmount] = useState(0);
  const { connected, balance, connectToSnap } = useAccount();

  const isMetaMaskReady = isLocalSnap(defaultSnapOrigin)
    ? state.isFlask
    : state.snapsDetected;

  const handleUpdateAmount = (amountStr: string) => {
    const amountNum = parseInt(amountStr);
    if (amountNum) {
      if (amountNum < 0) {
        setAmount(0);
      } else if (amountNum <= balance) {
        setAmount(amountNum);
      } else {
        setAmount(balance);
      }
    }
  };

  const handleSendClick = () => {};

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
          </>
        ),
        button: (
          <>
            {connected ? (
              <Button onClick={() => handleSendClick()} disabled={amount > 0}>
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
