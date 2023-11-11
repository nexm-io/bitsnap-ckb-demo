import { signPsbt } from "../../utils";
import { Button, Card } from "../../components";
import { useContext, useEffect, useState } from "react";
import { MetaMaskContext } from "../../hooks";
import { bitToSat, satToBit } from "../../mempool/address";
import { composeSendPsbt } from "../../utils/psbt";
import { validateTx } from "../../utils/psbtValidator";
import { RecommendedFees, getRecommendFees } from "../../mempool/fee";
import { submitTx } from "../../mempool/transaction";
import { toast } from "react-toastify";
import { truncateString } from "../../utils/string";
import styled from "styled-components";
import { AppContext } from "../../hooks/AppContext";
import { UtxoCard } from "./UtxoCard";

const Row = styled.div`
  display: flex;
  gap: 10px;
`;

export const SendCard = () => {
  const [state] = useContext(MetaMaskContext);
  const [amount, setAmount] = useState<string>("0");
  const [receiver, setReceiver] = useState<string>("");
  const [appState] = useContext(AppContext);
  const { network, accounts, totalUtxoValue, selectedUtxo } = appState;

  // Fees
  const [fees, setFees] = useState<RecommendedFees | undefined>();
  const [fee, setFee] = useState<string>("");
  const [finalFee, setFinalFee] = useState(0);

  // Account
  const [changeAddress, setChangeAddress] = useState<string>("");

  useEffect(() => {
    if (network) {
      getRecommendFees(network).then((fees) => setFees(fees));
    }
  }, [network]);

  useEffect(() => {
    if (accounts.length > 0) {
      setChangeAddress(accounts[0].address);
    }
  }, [accounts.length]);

  useEffect(() => {
    if (fees && !fee) {
      setFee(Object.keys(fees)[0]);
    }
  }, [fees]);

  const handleUpdateAmount = (amountStr: string) => {
    const amountNum = parseFloat(amountStr);
    const bit = satToBit(totalUtxoValue);
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
    if (!changeAddress) {
      toast("No change address");
      return;
    }

    if (!receiver) {
      toast("No receiver");
      return;
    }

    if (receiver && network && fees) {
      // // Construct Tx
      const { psbt, finalFee } = await composeSendPsbt(
        receiver,
        changeAddress,
        network,
        selectedUtxo,
        bitToSat(parseFloat(amount)),
        fees[fee]
      );
      if (
        !validateTx({
          psbt,
          utxoAmount: totalUtxoValue,
        })
      ) {
        throw Error("Transaction is not valid");
      }
      // Sign Tx
      setFinalFee(finalFee);
      const { txId, txHex } = await signPsbt(
        psbt.toBase64(),
        selectedUtxo.map((utxo) => utxo.account.address)
      );
      // Submit Tx
      submitTx(txHex, network).then((result) => {
        if (result) {
          toast(`submit tx success: ${txId}`);
        }
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
                <p>Fee Rate</p>
                <select
                  value={fee}
                  onChange={(e) => {
                    setFee(e.target.value);
                  }}
                >
                  {fees &&
                    Object.keys(fees).map((fee) => (
                      <option key={fee} value={fee}>
                        {fee}
                      </option>
                    ))}
                </select>
                <p>Change Address:</p>
                <select
                  value={changeAddress}
                  onChange={(e) => {
                    setChangeAddress(e.target.value);
                  }}
                >
                  {accounts.map((account) => (
                    <option key={account.address} value={account.address}>
                      {truncateString(account.address, 30)}
                    </option>
                  ))}
                </select>
                <br />
                <br />
              </div>
              <div>
                <UtxoCard />
              </div>
            </Row>
            <hr />
            <p>
              Fee Rate: <b>{fees ? fees[fee] : "0"}</b> sat/vB
            </p>
            <p>
              Final Fee: <b>{satToBit(finalFee)}</b> BIT
            </p>
          </>
        ),
        button: (
          <>
            <Button onClick={() => handleSendClick()} disabled={amount === "0"}>
              Send BTC
            </Button>
          </>
        ),
      }}
      disabled={!state.installedSnap}
    />
  );
};
