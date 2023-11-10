import { Button, Card } from "../../components";
import { BitcoinScriptType } from "../../utils/interface";
import { useContext, useEffect, useState } from "react";
import { MetaMaskContext, MetamaskActions } from "../../hooks";
import styled from "styled-components";
import { satToBit } from "../../mempool/address";
import { truncateString } from "../../utils/string";
import { toast } from "react-toastify";
import { BitcoinAccount, addAccount } from "../../utils";
import { AppActions, AppContext } from "../../hooks/AppContext";

const Row = styled.div`
  display: flex;
  gap: 10px;
`;

export const AccountCard = () => {
  const [state, dispatch] = useContext(MetaMaskContext);

  const [appState, appDispatch] = useContext(AppContext);
  const { accounts, totalBalance, balance } = appState;
  const [address, setAddress] = useState<string>("");
  const [currentAccount, setCurrentAccount] = useState<
    BitcoinAccount | undefined
  >();

  const addSnapAccount = (scriptType: BitcoinScriptType) => {
    addAccount(scriptType).then((account) => {
      if (account) {
        appDispatch({
          type: AppActions.AddAccount,
          payload: account,
        });
      }
    });
  };

  useEffect(() => {
    if (accounts.length > 0 && !currentAccount) {
      setCurrentAccount(accounts[0]);
      setAddress(accounts[0].address);
    }
  }, [accounts.length]);

  useEffect(() => {
    if (accounts.length > 0 && address) {
      const account = accounts.find((account) => account.address === address);
      if (account) {
        setCurrentAccount(account);
      }
    }
  }, [address]);

  const handleAddAccountClick = async (scriptType: BitcoinScriptType) => {
    try {
      addSnapAccount(scriptType);
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
            <div>
              <select
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                }}
              >
                {accounts.map((account) => (
                  <option key={account.address} value={account.address}>
                    {truncateString(account.address, 30)}
                  </option>
                ))}
              </select>
            </div>
            <br />
            <div>
              <Button
                onClick={() => {
                  if (currentAccount) {
                    navigator.clipboard.writeText(currentAccount.address);
                  } else if (accounts.length > 0) {
                    navigator.clipboard.writeText(accounts[0].address);
                  } else {
                    return;
                  }
                  toast.success("Copy address success");
                }}
              >
                Copy Address
              </Button>
            </div>
            <br />
            <br />
            <hr />
            <p>
              Selected Balance:{" "}
              {address && balance ? satToBit(balance[address]) : 0}
            </p>
            <p>
              Address Type: {currentAccount ? currentAccount.scriptType : ""}
            </p>
            <p>
              HDPath:{" "}
              {currentAccount ? currentAccount.derivationPath.join("/") : ""}
            </p>
            <hr />
            <p>Total Balance: {satToBit(totalBalance)}</p>
          </>
        ),
        button: (
          <>
            <p>
              <b>Add Account</b>
            </p>
            <Row>
              <Button
                onClick={() => handleAddAccountClick(BitcoinScriptType.P2TR)}
                disabled={!state.installedSnap}
              >
                Taproot
              </Button>
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
    />
  );
};
