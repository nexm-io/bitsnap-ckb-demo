import { Button, Card } from "../../components";
import { useContext, useEffect, useState } from "react";
import {
  MediaType,
  SupportedMediaTypes,
  buildInscriptionScript,
  commitInscription,
  revealInscription,
} from "../../utils/ordinal";
import { AppContext } from "../../hooks/AppContext";
import { toast } from "react-toastify";
import { truncateString } from "../../utils/string";
import { RecommendedFees, getRecommendFees } from "../../mempool/fee";
import { satToBit } from "../../mempool/address";
import { signPsbt } from "../../utils";
import { submitTx } from "../../mempool/transaction";
import styled from "styled-components";
import { UtxoCard } from "./UtxoCard";
import { BitcoinScriptType } from "../../utils/interface";
import { validateTx } from "../../utils/psbtValidator";

const Row = styled.div`
  display: flex;
  gap: 10px;
`;

const TextForm = (setMediaContent: (text: string) => void) => {
  return (
    <>
      <p>Text:</p>
      <input
        placeholder="Any Text"
        onChange={(event) => setMediaContent(event.target.value)}
      />
    </>
  );
};

const FileForm = (
  label: string,
  setMediaContent: (base64: string) => void,
  type?: string
) => {
  return (
    <>
      <p>{label}:</p>
      <input
        type="file"
        accept={type}
        onChange={(event) => {
          if (event.target.files) {
            const reader = new FileReader();
            reader.onloadend = () => {
              // Use a regex to remove data url part
              if (reader.result) {
                const base64String = (reader.result as string)
                  .replace("data:", "")
                  .replace(/^.+,/, "");
                setMediaContent(base64String);
              }
            };
            reader.readAsDataURL(event.target.files[0]);
          }
        }}
      />
    </>
  );
};

const Form = ({
  mediaType,
  setMediaContent,
}: {
  mediaType: string;
  setMediaContent: (base64: string) => void;
}) => {
  switch (mediaType) {
    case "image/jpeg":
    case "image/png":
      return FileForm("Image", setMediaContent, mediaType);
    case "video/mp4":
      return FileForm("Video", setMediaContent, mediaType);
    default:
      return TextForm(setMediaContent);
  }
};

export const InscribeCard = () => {
  const [state] = useContext(AppContext);
  const { selectedUtxo, accounts, network, totalUtxoValue } = state;
  const [mediaType, setMediaType] = useState<MediaType>(
    "text/plain;charset=utf-8"
  );
  const [mediaContent, setMediaContent] = useState<string>("");
  const [changeAddress, setChangeAddress] = useState<string>("");
  const [fees, setFees] = useState<RecommendedFees | undefined>();
  const [fee, setFee] = useState<string>("");
  const [finalFee, setFinalFee] = useState(0);

  useEffect(() => {
    if (accounts.length > 0) {
      setChangeAddress(accounts[0].address);
    }
  }, [accounts.length]);

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

  const handleOnClick = async () => {
    if (selectedUtxo.length === 0) {
      toast.error("No utxo selected");
      return;
    }
    if (selectedUtxo.length > 1) {
      toast.error("Only one utxo should be selected");
      return;
    }
    // Only Utxo from taproot
    const spenderUtxo = selectedUtxo[0];
    if (spenderUtxo.account.scriptType !== BitcoinScriptType.P2TR) {
      toast.error("Only utxo by taproot account");
      return;
    }

    if (network && fees) {
      // Construct Inscription
      const inscriptionScript = buildInscriptionScript(
        Buffer.from(spenderUtxo.account.pubKey, "hex"),
        mediaContent,
        mediaType,
        null,
        network
      );

      // Construct Tx
      const { psbt, finalFee } = await commitInscription(
        inscriptionScript,
        changeAddress,
        network,
        spenderUtxo,
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
      const { txId, txHex } = await signPsbt(psbt.toBase64(), [
        spenderUtxo.account.address,
      ]);
      // Submit Tx
      const result = await submitTx(txHex, network);
      if (result) {
        toast(`commit inscription tx success: ${txId}`);
      }

      //// Reveal
      const { psbt: revealpsbt, finalFee: revealFee } = await revealInscription(
        Buffer.from(spenderUtxo.account.pubKey, "hex"),
        changeAddress,
        network,
        inscriptionScript,
        fees[fee]
      );

      // Sign Tx
      setFinalFee(revealFee);
      const { txId: txRevealId, txHex: txRevealHex } = await signPsbt(
        revealpsbt.toBase64(),
        [spenderUtxo.account.address]
      );
      // Submit Tx
      const revealResult = await submitTx(txRevealHex, network);
      if (revealResult) {
        toast(`commit inscription tx success: ${txRevealId}`);
      }
    }
  };

  return (
    <Card
      fullWidth={true}
      content={{
        title: "Inscribe Ordinal",
        description: (
          <>
            <Row>
              <div>
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
                <p>Media Type</p>
                <select
                  value={mediaType}
                  onChange={(e) => {
                    setMediaContent("");
                    setMediaType(e.target.value as MediaType);
                  }}
                >
                  {SupportedMediaTypes.map((mediaTypes) => (
                    <option key={mediaTypes} value={mediaTypes}>
                      {mediaTypes}
                    </option>
                  ))}
                </select>
                <Form mediaType={mediaType} setMediaContent={setMediaContent} />
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
        button: <Button onClick={handleOnClick}>Inscribe</Button>,
      }}
    />
  );
};
