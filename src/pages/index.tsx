import { useContext } from "react";
import styled from "styled-components";
import { MetaMaskContext } from "../hooks";
import { ConnectCard } from "../components/Demo/ConnectCard";
import { NetworkCard } from "../components/Demo/NetworkCard";
import { AccountCard } from "../components/Demo/AccountCard";
import { SendCard } from "../components/Demo/SendCard";
import { AppProvider } from "../hooks/AppContext";
import { InscribeCard } from "../components/Demo/InscribeCard";
import { MyOrdinals } from "../components/Demo/MyOrdinalCard";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin-top: 7.6rem;
  margin-bottom: 7.6rem;
  ${({ theme }) => theme.mediaQueries.small} {
    padding-left: 2.4rem;
    padding-right: 2.4rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    width: auto;
  }
`;

const Heading = styled.h1`
  margin-top: 0;
  margin-bottom: 2.4rem;
  text-align: center;
`;

const Span = styled.span`
  color: ${(props) => props.theme.colors.primary.default};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 0;
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
  }
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 100rem;
  width: 100%;
  height: 100%;
  margin-top: 1.5rem;
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error.muted};
  border: 1px solid ${({ theme }) => theme.colors.error.default};
  color: ${({ theme }) => theme.colors.error.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-bottom: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;
  ${({ theme }) => theme.mediaQueries.small} {
    padding: 1.6rem;
    margin-bottom: 1.2rem;
    margin-top: 1.2rem;
    max-width: 100%;
  }
`;

const Index = () => {
  const [state] = useContext(MetaMaskContext);

  return (
    <Container>
      <Heading>
        Welcome to <Span>Bitsnap Wallet</Span>
      </Heading>
      <Subtitle>
        Non-custodial wallet for <code>Bitcoin</code> network
      </Subtitle>
      <AppProvider>
        {/* 1st row */}
        <CardContainer>
          {state.error && (
            <ErrorMessage>
              <b>An error happened:</b> {state.error.message}
            </ErrorMessage>
          )}
          <ConnectCard />
          <NetworkCard />
        </CardContainer>
        {/* 2nd row */}
        <CardContainer>
          <AccountCard />
          <SendCard />
        </CardContainer>
        {/* 3rd row */}
        <CardContainer>
          <InscribeCard />
          <MyOrdinals />
        </CardContainer>
      </AppProvider>
    </Container>
  );
};

export default Index;
