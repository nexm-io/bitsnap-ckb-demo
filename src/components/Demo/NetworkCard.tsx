import { Button, Card } from "../../components";
import { BitcoinNetwork } from "../../utils/interface";
import { useContext } from "react";
import { MetaMaskContext } from "../../hooks";
import styled from "styled-components";
import { AppActions, AppContext } from "../../hooks/AppContext";
import { updateNetworkInSnap } from "../../utils";

const Row = styled.div`
  display: flex;
  gap: 10px;
`;

export const NetworkCard = () => {
  const [state] = useContext(MetaMaskContext);
  const [appState, appDispatch] = useContext(AppContext);
  const { network } = appState;

  const switchNetwork = (network: BitcoinNetwork) => {
    updateNetworkInSnap(network).then(() =>
      appDispatch({
        type: AppActions.SwitchNetwork,
        payload: network,
      })
    );
  };

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
    />
  );
};
