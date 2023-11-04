import { useContext } from "react";
import { MetamaskActions, MetaMaskContext } from "../../hooks";
import {
  connectSnap,
  getSnap,
  isLocalSnap,
  shouldDisplayReconnectButton,
} from "../../utils";
import {
  Card,
  InstallFlaskButton,
  ConnectButton,
  ReconnectButton,
} from "../../components";
import { defaultSnapOrigin } from "../../config";

export const ConnectCard = () => {
  const [state, dispatch] = useContext(MetaMaskContext);

  const isMetaMaskReady = isLocalSnap(defaultSnapOrigin)
    ? state.isFlask
    : state.snapsDetected;

  const handleConnectClick = async () => {
    try {
      await connectSnap();
      const installedSnap = await getSnap();

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  return (
    <>
      {!isMetaMaskReady && (
        <Card
          content={{
            title: "Install",
            description:
              "Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.",
            button: <InstallFlaskButton />,
          }}
          fullWidth
        />
      )}
      {!state.installedSnap && (
        <Card
          content={{
            title: "Connect",
            description:
              "Get started by connecting to and installing the nexum snap.",
            button: (
              <ConnectButton
                onClick={handleConnectClick}
                disabled={!isMetaMaskReady}
              />
            ),
          }}
          disabled={!isMetaMaskReady}
        />
      )}
      {shouldDisplayReconnectButton(state.installedSnap) && (
        <Card
          content={{
            title: "Reconnect",
            description:
              "While connected to a local running snap this button will always be displayed in order to update the snap if a change is made.",
            button: (
              <ReconnectButton
                onClick={handleConnectClick}
                disabled={!state.installedSnap}
              />
            ),
          }}
          disabled={!state.installedSnap}
        />
      )}
    </>
  );
};
