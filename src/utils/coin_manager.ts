import { payments, networks } from "bitcoinjs-lib";
import BIP32Factory from "bip32";
import { BitcoinNetwork, BitcoinScriptType } from "./interface";
import { detectNetworkAndScriptType, networkAndScriptMap } from "./bitcoin";
import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";

export const toXOnly = (pubKey: Buffer) =>
  pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);

export class Bitcoin {
  public deriveAddress(
    publicKey: Buffer,
    scriptType: BitcoinScriptType,
    network: BitcoinNetwork
  ): string {
    const networkConfig = this.getNetworkConfig(network);
    let address: string | undefined = "";
    switch (scriptType) {
      case BitcoinScriptType.P2PKH:
        address = payments.p2pkh({
          pubkey: publicKey,
          network: networkConfig,
        }).address;
        break;
      case BitcoinScriptType.P2SH_P2WPKH:
        address = payments.p2sh({
          redeem: payments.p2wpkh({
            pubkey: publicKey,
            network: networkConfig,
          }),
          network: networkConfig,
        }).address;
        break;
      case BitcoinScriptType.P2WPKH:
        address = payments.p2wpkh({
          pubkey: publicKey,
          network: networkConfig,
        }).address;
        break;
      case BitcoinScriptType.P2TR:
        // Since internalKey is an xOnly pubkey, we drop the DER header byte
        const xOnlyPubkey = toXOnly(publicKey);
        address = payments.p2tr({
          internalPubkey: xOnlyPubkey,
          network: networkConfig,
        }).address;
        break;
      default:
        address = "";
    }
    if (address) {
      return address;
    } else {
      throw new Error("generate address failed");
    }
  }

  public xpubToPubkey(xpub: string, change: number, index: number) {
    const { pubKey, network } = this.convertPubKeyFormat(xpub);
    const node = BIP32Factory(ecc).fromBase58(pubKey, network);
    return node.derive(change).derive(index).publicKey;
  }

  public convertPubKeyFormat(extendedPubKey: string) {
    const { network, config } = detectNetworkAndScriptType(extendedPubKey);
    const networkConfig = this.getNetworkConfig(network);
    const targetPrefix = network === BitcoinNetwork.Main ? "xpub" : "tpub";
    return {
      pubKey: this.transferNode(extendedPubKey, targetPrefix, config),
      network: networkConfig,
    };
  }

  private getNetworkConfig(network: BitcoinNetwork) {
    let networkConfig = networks.bitcoin;
    if (network === BitcoinNetwork.Test) {
      networkConfig = networks.testnet;
    }
    return networkConfig;
  }

  private transferNode(
    extendedPubKey: string,
    prefix: string,
    config: { private: number; public: number }
  ) {
    const node = BIP32Factory(ecc).fromBase58(extendedPubKey, {
      bip32: config,
      wif: 0,
    });
    const mainConfig = networkAndScriptMap[prefix]["config"];
    const transferNode = BIP32Factory(ecc).fromPublicKey(
      node.publicKey,
      node.chainCode,
      {
        bip32: mainConfig,
        wif: 0,
      }
    );
    return transferNode.toBase58();
  }
}

export const coinManager = new Bitcoin();
