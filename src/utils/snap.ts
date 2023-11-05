import { MetaMaskInpageProvider } from "@metamask/providers";
import { defaultSnapOrigin } from "../config";
import { GetSnapsResponse, Snap } from "../types";
import { BitcoinNetwork, BitcoinScriptType } from "./interface";
import { SnapError } from "./errors";

/**
 * Get the installed snaps in MetaMask.
 *
 * @param provider - The MetaMask inpage provider.
 * @returns The snaps installed in MetaMask.
 */
export const getSnaps = async (
  provider?: MetaMaskInpageProvider
): Promise<GetSnapsResponse> =>
  (await (provider ?? window.ethereum).request({
    method: "wallet_getSnaps",
  })) as unknown as GetSnapsResponse;
/**
 * Connect a snap to MetaMask.
 *
 * @param snapId - The ID of the snap.
 * @param params - The params to pass with the snap to connect.
 */
export const connectSnap = async (
  snapId: string = defaultSnapOrigin,
  params: Record<"version" | string, unknown> = {}
) => {
  await window.ethereum.request({
    method: "wallet_requestSnaps",
    params: {
      [snapId]: params,
    },
  });
};

/**
 * Get the snap from MetaMask.
 *
 * @param version - The version of the snap to install (optional).
 * @returns The snap object returned by the extension.
 */
export const getSnap = async (version?: string): Promise<Snap | undefined> => {
  try {
    const snaps = await getSnaps();

    return Object.values(snaps).find(
      (snap) =>
        snap.id === defaultSnapOrigin && (!version || snap.version === version)
    );
  } catch (e) {
    console.log("Failed to obtain installed snap", e);
    return undefined;
  }
};

/**
 *
 * get the accounts from snap
 *
 */

export interface BitcoinAccount {
  scriptType: BitcoinScriptType;
  index: number;
  pubKey: string;
  address: string;
  mfp: string;
  network: "main" | "test";
}

export async function getAccounts(): Promise<BitcoinAccount[]> {
  try {
    return (await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "btc_getAccounts",
        },
      },
    })) as BitcoinAccount[];
  } catch (err: any) {
    const error = new SnapError(err?.message || "Get accounts failed");
    console.error(error);
    throw error;
  }
}

export async function getCurrentAccount(): Promise<BitcoinAccount> {
  try {
    return (await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "btc_getCurrentAccount",
        },
      },
    })) as BitcoinAccount;
  } catch (err: any) {
    const error = new SnapError(err?.message || "Get current accounts failed");
    console.error(error);
    throw error;
  }
}

export async function addAccount(
  scriptType: BitcoinScriptType,
  index: number
): Promise<BitcoinAccount> {
  try {
    return (await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "btc_addAccount",
          params: {
            scriptType,
            index,
          },
        },
      },
    })) as BitcoinAccount;
  } catch (err: any) {
    const error = new SnapError(err?.message || "Add new account failed");
    console.error(error);
    throw error;
  }
}

export async function switchAccount(
  address: string,
  mfp: string
): Promise<BitcoinAccount> {
  try {
    return (await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "btc_switchAccount",
          params: {
            address,
            mfp,
          },
        },
      },
    })) as BitcoinAccount;
  } catch (err: any) {
    const error = new SnapError(err?.message || "Switch account failed");
    console.error(error);
    throw error;
  }
}

/**
 *
 * Account Connect
 *
 */

export async function isConnected(
  address: string,
  network: BitcoinNetwork
): Promise<boolean> {
  try {
    const networkParams = network === BitcoinNetwork.Main ? "main" : "test";
    return (await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "btc_isConnected",
          params: {
            address,
            network: networkParams,
          },
        },
      },
    })) as boolean;
  } catch (err: any) {
    const error = new SnapError(err?.message || "Get connect state failed");
    console.error(error);
    throw error;
  }
}

export async function connect(
  address: string,
  network: BitcoinNetwork
): Promise<boolean> {
  try {
    const networkParams = network === BitcoinNetwork.Main ? "main" : "test";
    return (await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "btc_connect",
          params: {
            address,
            network: networkParams,
          },
        },
      },
    })) as boolean;
  } catch (err: any) {
    const error = new SnapError(err?.message || "Connect failed");
    console.error(error);
    throw error;
  }
}

export async function disconnect(
  address: string,
  network: BitcoinNetwork
): Promise<boolean> {
  try {
    const networkParams = network === BitcoinNetwork.Main ? "main" : "test";
    return (await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "btc_disconnect",
          params: {
            address,
            network: networkParams,
          },
        },
      },
    })) as boolean;
  } catch (err: any) {
    const error = new SnapError(err?.message || "Disconnect failed");
    console.error(error);
    throw error;
  }
}

export async function updateNetworkInSnap(network: BitcoinNetwork) {
  const networkParams = network === BitcoinNetwork.Main ? "main" : "test";
  try {
    return await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "btc_network",
          params: {
            action: "set",
            network: networkParams,
          },
        },
      },
    });
  } catch (err: any) {
    const error = new SnapError(err?.message || "Snap set Network failed");
    console.error(error);
    throw error;
  }
}

export async function getNetworkInSnap(): Promise<string> {
  try {
    return (await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "btc_network",
          params: {
            action: "get",
          },
        },
      },
    })) as string;
  } catch (err: any) {
    const error = new SnapError(err?.message || "Get Snap Network failed");
    console.error(error);
    throw error;
  }
}

export async function signPsbt(base64Psbt: string) {
  try {
    return (await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "btc_signPsbt",
          params: {
            psbt: base64Psbt,
          },
        },
      },
    })) as Promise<{ txId: string; txHex: string }>;
  } catch (err: any) {
    const error = new SnapError(err?.message || "Sign PSBT failed");
    console.error(error);
    throw error;
  }
}

export enum GetLNWalletDataKey {
  Password = "password",
  Credential = "credential",
  PubKey = "pubkey",
}

export async function getLNWalletData(
  key: GetLNWalletDataKey,
  walletId?: string,
  type?: "get" | "refresh"
) {
  try {
    return await window.ethereum.request<string>({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "btc_getLNDataFromSnap",
          params: {
            key,
            ...(walletId && { walletId }),
            ...(type && { type }),
          },
        },
      },
    });
  } catch (err: any) {
    const error = new SnapError(err?.message || "Get LNWalletData failed");
    console.error(error);
    throw error;
  }
}
export interface SaveLNData {
  walletId: string;
  credential: string;
  password: string;
}

export async function saveLNDataToSnap({
  walletId,
  credential,
  password,
}: SaveLNData) {
  try {
    return await window.ethereum.request<string>({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "btc_saveLNDataToSnap",
          params: {
            walletId,
            credential,
            password,
          },
        },
      },
    });
  } catch (err: any) {
    const error = new SnapError(err?.message || "Save LNData failed");
    console.error(error);
    throw error;
  }
}

export async function signLNInvoice(
  invoice: string
): Promise<string | undefined | null> {
  try {
    return window.ethereum.request<string>({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "btc_signLNInvoice",
          params: {
            invoice,
          },
        },
      },
    });
  } catch (err: any) {
    const error = new SnapError(err?.message || "Sign invoice failed");
    console.error(error);
    throw error;
  }
}

export const isLocalSnap = (snapId: string) => snapId.startsWith("local:");
