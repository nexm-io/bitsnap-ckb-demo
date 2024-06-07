import { Button, Card } from "../../components";
import { useContext, useEffect, useState } from "react";
import { MetaMaskContext, MetamaskActions } from "../../hooks";
import { truncateString } from "../../utils/string";
import { toast } from "react-toastify";
import { CkbAccount, addCkbAccount } from "../../utils";
import { AppActions, AppContext } from "../../hooks/AppCkbContext";
import { formatUnit } from "@ckb-lumos/lumos/utils";

export const AccountCard = () => {
  const [state, dispatch] = useContext(MetaMaskContext);

  const [appState, appDispatch] = useContext(AppContext);
  const { accounts, totalBalance, balance, network } = appState;
  const [address, setAddress] = useState<string>("");
  const [currentAccount, setCurrentAccount] = useState<
    CkbAccount | undefined
  >();

  const addSnapAccount = () => {
    addCkbAccount().then((account) => {
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
    if (accounts.length > 0 && currentAccount) {
      // change network
      if (currentAccount.derivationPath[2] !== accounts[0].derivationPath[2]) {
        setCurrentAccount(accounts[0]);
        setAddress(accounts[0].address);
      }
    }
  }, [network, accounts.length]);

  useEffect(() => {
    if (accounts.length > 0 && address) {
      const account = accounts.find((account) => account.address === address);
      if (account) {
        setCurrentAccount(account);
      }
    }
  }, [address]);

  const handleAddAccountClick = async () => {
    try {
      addSnapAccount();
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
                    {truncateString(account.address ?? "", 30)}
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
              {address && balance && balance[address]
                ? formatUnit(balance[address], "ckb")
                : 0}
            </p>
            <p>
              HDPath:{" "}
              {currentAccount && currentAccount.derivationPath
                ? currentAccount.derivationPath.join("/")
                : ""}
            </p>
            <hr />
            <p>Total Balance: {formatUnit(totalBalance, "ckb")}</p>
          </>
        ),
        button: (
          <>
            <Button
              onClick={() => handleAddAccountClick()}
              disabled={!state.installedSnap}
            >
              Add Account
            </Button>
          </>
        ),
      }}
      disabled={!state.installedSnap}
    />
  );
};
