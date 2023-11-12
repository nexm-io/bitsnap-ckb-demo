import styled from "styled-components";
import { Card } from "../../components";
import { useIndexer } from "../../hooks/useIndexer";
import { getOrdinalContent } from "../../api/xverse/wallet";
import { useContext } from "react";
import { AppContext } from "../../hooks/AppContext";

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

export const MyOrdinals = () => {
  const [appState] = useContext(AppContext);
  const { network } = appState;
  const { ordinals } = useIndexer();

  return (
    <>
      <Card
        content={{
          title: "My Ordinals",
          description: (
            <Container>
              {ordinals.map((ordinal) => (
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
