import { Button, Card } from "../../components";
import { useContext, useEffect, useState } from "react";
import { MetaMaskContext } from "../../hooks";
import { toast } from "react-toastify";
import styled from "styled-components";
import { AppContext } from "../../hooks/AppCkbContext";
import { formatUnit, parseUnit } from "@ckb-lumos/lumos/utils";
import { truncateString } from "../../utils/string";
import { getTransferMessage } from "../../utils/ckb/lib";

const Row = styled.div`
  display: flex;
  gap: 10px;
`;

export const SendCard = () => {
  const [state] = useContext(MetaMaskContext);
  const [amount, setAmount] = useState<string>("0");
  const [receiver, setReceiver] = useState<string>("");
  const [appState] = useContext(AppContext);
  const { network, accounts } = appState;
  const [address, setAddress] = useState<string>("");

  const handleUpdateAmount = (amountStr: string) => {
    const amountNum = parseFloat(amountStr);
    if (amountNum) {
      if (amountNum < 0) {
        setAmount("0");
      } else if (amountNum) {
        setAmount(amountNum.toString());
      }
    } else {
      setAmount(amountStr);
    }
  };

  useEffect(() => {
    if (accounts.length > 0) {
      setAddress(accounts[0].address);
    }
  }, [accounts.length]);

  const handleSendClick = async () => {
    if (!receiver) {
      toast("No receiver");
      return;
    }

    if (receiver && network) {
      // Transfer CKB
      getTransferMessage({
        from: address,
        to: receiver,
        amount: parseUnit(amount, "ckb").toString(),
      }).then((hash: string) => {
        toast.success(`Tx ${hash} submit success `);
      });
    }
  };

  return (
    <Card
      fullWidth={true}
      content={{
        title: "Send Coin",
        description: (
          <>
            <div>
              <select
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                }}
              >
                {accounts.map((account) => (
                  <option key={account.address} value={account.address}>
                    {truncateString(account.address ?? "", 30)}
                  </option>
                ))}
              </select>
            </div>
            <br />
            <Row>
              <div>
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
                <br />
                <br />
              </div>
            </Row>
            <hr />
          </>
        ),
        button: (
          <>
            <Button onClick={() => handleSendClick()} disabled={amount === "0"}>
              Send CKB
            </Button>
          </>
        ),
      }}
      disabled={!state.installedSnap}
    />
  );
};
