import { MetaMaskInpageProvider } from "@metamask/providers";
import { defaultSnapOrigin } from "../config";
import { GetSnapsResponse, Snap } from "../types";
import { BitcoinNetwork, BitcoinScriptType, CkbNetwork } from "./interface";
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
  derivationPath: string[];
  pubKey: string;
  address: string;
  mfp: string;
}

export type CkbAccount = {
  derivationPath: string[];
  pubKey: string;
  address: string;
  mfp: string;
};

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

export async function getCkbAccounts(): Promise<CkbAccount[]> {
  try {
    return (await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "ckb_getAccounts",
        },
      },
    })) as CkbAccount[];
  } catch (err: any) {
    const error = new SnapError(err?.message || "Get accounts failed");
    console.error(error);
    throw error;
  }
}

export async function addAccount(
  scriptType: BitcoinScriptType
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

export async function addCkbAccount(): Promise<CkbAccount> {
  try {
    return (await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "ckb_addAccount",
        },
      },
    })) as CkbAccount;
  } catch (err: any) {
    const error = new SnapError(err?.message || "Add new account failed");
    console.error(error);
    throw error;
  }
}

export async function addAccounts(): Promise<BitcoinAccount[]> {
  try {
    return (await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "btc_addAccounts",
        },
      },
    })) as BitcoinAccount[];
  } catch (err: any) {
    const error = new SnapError(
      err?.message || "Add 4 types of address failed"
    );
    console.error(error);
    throw error;
  }
}

export async function updateNetworkInSnap(network: BitcoinNetwork) {
  try {
    return await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "btc_network",
          params: {
            action: "set",
            network: network,
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

export async function updateCkbNetworkInSnap(network: CkbNetwork) {
  try {
    return await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "ckb_network",
          params: {
            action: "set",
            network: network,
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

export async function getNetworkInSnap(): Promise<BitcoinNetwork> {
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
    })) as BitcoinNetwork;
  } catch (err: any) {
    const error = new SnapError(err?.message || "Get Snap Network failed");
    console.error(error);
    throw error;
  }
}

export async function getCkbNetworkInSnap(): Promise<CkbNetwork> {
  try {
    return (await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "ckb_network",
          params: {
            action: "get",
          },
        },
      },
    })) as CkbNetwork;
  } catch (err: any) {
    const error = new SnapError(err?.message || "Get Snap Network failed");
    console.error(error);
    throw error;
  }
}

export async function signPsbt(base64Psbt: string, signerAddresses: string[]) {
  try {
    return (await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "btc_signPsbt",
          params: {
            psbt: base64Psbt,
            signerAddresses,
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

export async function signCkbTx(txMessage: string, senderAddress: string) {
  try {
    return (await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: {
        snapId: defaultSnapOrigin,
        request: {
          method: "ckb_signTx",
          params: {
            txMessage,
            senderAddress,
          },
        },
      },
    })) as string;
  } catch (err: any) {
    const error = new SnapError(err?.message || "Sign Tx failed");
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
