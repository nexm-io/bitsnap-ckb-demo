import styled from "styled-components";
import { Card } from "../../components";
import { Ordinal, getOrdinalContent } from "../../api/xverse/wallet";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../hooks/AppContext";
import { Utxo } from "../../api/mempool/utxo";

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-height: 100%;
`;

const Frame = styled.iframe`
  transform: scale(0.6);
  background-color: white;
  margin: -20px -50px;
`;

type OrdUtxo = Ordinal & Utxo;

export const MyOrdinals = () => {
  const [appState] = useContext(AppContext);
  const { network, ordinals, ordUtxo } = appState;
  const [_ordinals, setOrdinals] = useState<OrdUtxo[]>([]);

  useEffect(() => {
    if (ordinals.length > 0 && Object.keys(ordUtxo).length > 0) {
      setOrdinals(
        ordinals.map((ordinal) => {
          return {
            ...ordinal,
            ...ordUtxo[ordinal.id],
          };
        })
      );
    }
  }, [ordinals, ordUtxo]);

  return (
    <>
      <Card
        content={{
          title: "My Ordinals",
          description: (
            <Container>
              {_ordinals.map((ordinal) => (
                <div key={ordinal.id}>
                  <div>{ordinal.number}</div>
                  <div>
                    <i>{ordinal.content_type}</i>
                  </div>
                  <Frame src={getOrdinalContent(network!, ordinal.id)} />
                </div>
              ))}
            </Container>
          ),
          button: <></>,
        }}
      />
    </>
  );
};
