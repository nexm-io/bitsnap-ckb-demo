import { isLocalSnap, shouldDisplayReconnectButton } from "../../utils";
import { Button, Card } from "../../components";
import { BitcoinNetwork } from "../../utils/interface";
import { useNetwork } from "../../hooks/useNetwork";
import { useContext } from "react";
import { MetaMaskContext } from "../../hooks";
import { defaultSnapOrigin } from "../../config";
import styled from "styled-components";

const Row = styled.div`
  display: flex;
  gap: 10px;
`;

export const NetworkCard = () => {
  const { network, switchNetwork } = useNetwork();
  const [state] = useContext(MetaMaskContext);

  const isMetaMaskReady = isLocalSnap(defaultSnapOrigin)
    ? state.isFlask
    : state.snapsDetected;

  return (
    <Card
      content={{
        title: "Network",
        description: network ? (
          <>
            <p>Your current network:</p>
            <p>
              <b>{network.toString()}</b>
            </p>
          </>
        ) : (
          "Please connect to one of below networks"
        ),
        button: (
          <Row>
            <Button
              onClick={() => switchNetwork(BitcoinNetwork.Main)}
              disabled={network === "mainnet"}
            >
              BTC Mainnet
            </Button>
            <Button
              onClick={() => switchNetwork(BitcoinNetwork.Test)}
              disabled={network === "testnet"}
            >
              BTC Testnet
            </Button>
          </Row>
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
