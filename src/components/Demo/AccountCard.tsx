import { isLocalSnap, shouldDisplayReconnectButton } from "../../utils";
import { Button, Card } from "../../components";
import { BitcoinScriptType } from "../../utils/interface";
import { useContext } from "react";
import { MetaMaskContext, MetamaskActions } from "../../hooks";
import { defaultSnapOrigin } from "../../config";
import styled from "styled-components";
import { useAccount } from "../../hooks/useAccount";
import { satToBit } from "../../mempool/address";
import { truncateString } from "../../utils/string";
import { toast } from "react-toastify";

const Copy = styled.span`
  cursor: pointer;
`;

const Row = styled.div`
  display: flex;
  gap: 10px;
`;

export const AccountCard = () => {
  const [state, dispatch] = useContext(MetaMaskContext);

  const {
    accounts,
    currentAccount,
    addSnapAccount,
    switchSnapAccount,
    balance,
  } = useAccount();

  const isMetaMaskReady = isLocalSnap(defaultSnapOrigin)
    ? state.isFlask
    : state.snapsDetected;

  const handleAddAccountClick = async (scriptType: BitcoinScriptType) => {
    try {
      addSnapAccount(scriptType);
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleAccountChange = async (e: any) => {
    try {
      if (e.target.value) {
        switchSnapAccount(e.target.value);
      }
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  return (
    <Card
      content={{
        title: "Accounts",
        description: (
          <>
            <select
              value={currentAccount?.address}
              onChange={handleAccountChange}
            >
              {accounts.map((account) => (
                <option key={account.address} value={account.address}>
                  {truncateString(account.address, 30)}
                </option>
              ))}
            </select>
            <br />
            <br />
            <hr />
            <p>
              <b>Current Account</b>{" "}
              <p>
                Address:{" "}
                <Copy
                  onClick={() => {
                    if (currentAccount) {
                      navigator.clipboard.writeText(currentAccount.address);
                      toast.success("Copy address success");
                    }
                  }}
                >
                  {currentAccount
                    ? truncateString(currentAccount.address, 20)
                    : ""}
                </Copy>
              </p>
              <p>Balance: {satToBit(balance)}</p>
            </p>
          </>
        ),
        button: (
          <>
            <p>
              <b>Add Account</b>
            </p>
            <Row>
              <Button disabled>Taproot</Button>
              <Button
                onClick={() =>
                  handleAddAccountClick(BitcoinScriptType.P2SH_P2WPKH)
                }
                disabled={!state.installedSnap}
              >
                Nested SegWit
              </Button>
            </Row>
            <br />
            <Row>
              <Button
                onClick={() => handleAddAccountClick(BitcoinScriptType.P2PKH)}
                disabled={!state.installedSnap}
              >
                Legacy
              </Button>
              <Button
                onClick={() => handleAddAccountClick(BitcoinScriptType.P2WPKH)}
                disabled={!state.installedSnap}
              >
                Native SegWit
              </Button>
            </Row>
          </>
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
