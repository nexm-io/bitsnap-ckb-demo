import { isLocalSnap, signPsbt } from "../../utils";
import { Button, Card } from "../../components";
import { useContext, useEffect, useState } from "react";
import { MetaMaskContext } from "../../hooks";
import { defaultSnapOrigin } from "../../config";
import { bitToSat, satToBit } from "../../mempool/address";
import { composePsbt } from "../../utils/psbt";
import { validateTx } from "../../utils/psbtValidator";
import { RecommendedFees, getRecommendFees } from "../../mempool/fee";
import { useNetwork } from "../../hooks/useNetwork";
import { submitTx } from "../../mempool/transaction";
import { toast } from "react-toastify";
import { truncateString } from "../../utils/string";
import { useAccount } from "../../hooks/useAccount";
import { useUtxo } from "../../hooks/useUtxo";
import styled from "styled-components";

const Row = styled.div`
  display: flex;
  gap: 10px;
`;

export const SendCard = () => {
  const [state] = useContext(MetaMaskContext);
  const [amount, setAmount] = useState<string>("0");
  const [receiver, setReceiver] = useState<string>("");
  const { network } = useNetwork();
  // Fees
  const [fees, setFees] = useState<RecommendedFees | undefined>();
  const [fee, setFee] = useState<string>("");
  const [finalFee, setFinalFee] = useState(0);

  // Utxo
  const { selected, totalUtxoValue, listUtxo, setSelected } = useUtxo();

  // Account
  const { accounts } = useAccount();
  const [changeAddress, setChangeAddress] = useState<string>(
    accounts.length > 0 ? accounts[0].address : ""
  );

  useEffect(() => {
    if (network) {
      getRecommendFees(network).then((fees) => setFees(fees));
    }
  }, [network]);

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
      const { psbt, finalFee } = await composePsbt(
        receiver,
        changeAddress,
        network,
        selected,
        bitToSat(parseFloat(amount)),
        fees[fee]
      );
      if (
        !validateTx({
          psbt,
          // TODO: must calculate from list utxo
          utxoAmount: totalUtxoValue,
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

  const UtxoCard = () => {
    const handleOnChange = (index: number) => {
      if (
        selected.findIndex(
          (utxo) =>
            utxo.txid === listUtxo[index].txid &&
            utxo.vout === listUtxo[index].vout
        ) === -1
      ) {
        setSelected([...selected, listUtxo[index]]);
      } else {
        setSelected(
          selected.filter(
            (utxo) =>
              utxo.txid !== listUtxo[index].txid ||
              utxo.vout !== listUtxo[index].vout
          )
        );
      }
    };

    return (
      <>
        <b>UTXO</b>
        <br />
        {listUtxo.map((utxo, index) => {
          return (
            <div key={index}>
              <div>
                <input
                  type="checkbox"
                  name={utxo.txid}
                  value={index}
                  checked={selected
                    .map((v) => `${v.txid}-${v.vout}`)
                    .includes(`${utxo.txid}-${utxo.vout}`)}
                  onChange={() => handleOnChange(index)}
                />
                <label
                  onClick={() => {
                    navigator.clipboard.writeText(utxo.account.address);
                    toast.success("Copy address success");
                  }}
                >
                  {truncateString(utxo.account.address, 20)}
                </label>
              </div>
              <div className="right-section">{utxo.value} sat</div>
            </div>
          );
        })}
        <div>
          <p>Total: {totalUtxoValue} sat</p>
        </div>
      </>
    );
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
