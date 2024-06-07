import { Button, Card } from "../../components";
import { CkbNetwork } from "../../utils/interface";
import { useContext } from "react";
import { MetaMaskContext } from "../../hooks";
import styled from "styled-components";
import { AppActions, AppContext } from "../../hooks/AppCkbContext";
import { updateCkbNetworkInSnap } from "../../utils";

const Row = styled.div`
  display: flex;
  gap: 10px;
`;

export const NetworkCard = () => {
  const [state] = useContext(MetaMaskContext);
  const [appState, appDispatch] = useContext(AppContext);
  const { network } = appState;

  const switchNetwork = (network: CkbNetwork) => {
    updateCkbNetworkInSnap(network).then(() =>
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
              onClick={() => switchNetwork(CkbNetwork.Main)}
              disabled={network === CkbNetwork.Main}
            >
              CKB Mainnet
            </Button>
            <Button
              onClick={() => switchNetwork(CkbNetwork.Test)}
              disabled={network === CkbNetwork.Test}
            >
              CKB Testnet
            </Button>
            <Button
              onClick={() => switchNetwork(CkbNetwork.Dev)}
              disabled={network === CkbNetwork.Dev}
            >
              CKB Devnet
            </Button>
          </Row>
        ),
      }}
      disabled={!state.installedSnap}
    />
  );
};
