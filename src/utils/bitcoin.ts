import { BitcoinNetwork, BitcoinScriptType } from "./interface";
import { SupportedCoins } from "./supportedCoins";

type networkAndScriptType = {
  [key: string]: {
    network: BitcoinNetwork;
    scriptType: BitcoinScriptType;
    config: { private: number; public: number };
  };
};

// https://github.com/satoshilabs/slips/blob/master/slip-0132.md
export const networkAndScriptMap: networkAndScriptType = {
  xpub: {
    network: BitcoinNetwork.Main,
    scriptType: BitcoinScriptType.P2PKH,
    config: { private: 0x0488ade4, public: 0x0488b21e },
  },
  xprv: {
    network: BitcoinNetwork.Main,
    scriptType: BitcoinScriptType.P2PKH,
    config: { private: 0x0488ade4, public: 0x0488b21e },
  },
  ypub: {
    network: BitcoinNetwork.Main,
    scriptType: BitcoinScriptType.P2SH_P2WPKH,
    config: { private: 0x049d7878, public: 0x049d7cb2 },
  },
  yprv: {
    network: BitcoinNetwork.Main,
    scriptType: BitcoinScriptType.P2SH_P2WPKH,
    config: { private: 0x049d7878, public: 0x049d7cb2 },
  },
  zpub: {
    network: BitcoinNetwork.Main,
    scriptType: BitcoinScriptType.P2WPKH,
    config: { private: 0x04b2430c, public: 0x04b24746 },
  },
  zprv: {
    network: BitcoinNetwork.Main,
    scriptType: BitcoinScriptType.P2WPKH,
    config: { private: 0x04b2430c, public: 0x04b24746 },
  },
  tpub: {
    network: BitcoinNetwork.Test,
    scriptType: BitcoinScriptType.P2PKH,
    config: { private: 0x04358394, public: 0x043587cf },
  },
  tprv: {
    network: BitcoinNetwork.Test,
    scriptType: BitcoinScriptType.P2PKH,
    config: { private: 0x04358394, public: 0x043587cf },
  },
  upub: {
    network: BitcoinNetwork.Test,
    scriptType: BitcoinScriptType.P2SH_P2WPKH,
    config: { private: 0x044a4e28, public: 0x044a5262 },
  },
  uprv: {
    network: BitcoinNetwork.Test,
    scriptType: BitcoinScriptType.P2SH_P2WPKH,
    config: { private: 0x044a4e28, public: 0x044a5262 },
  },
  vpub: {
    network: BitcoinNetwork.Test,
    scriptType: BitcoinScriptType.P2WPKH,
    config: { private: 0x045f18bc, public: 0x045f1cf6 },
  },
  vprv: {
    network: BitcoinNetwork.Test,
    scriptType: BitcoinScriptType.P2WPKH,
    config: { private: 0x045f18bc, public: 0x045f1cf6 },
  },
  // TODO: taproot handle
};

export const detectNetworkAndScriptType = (extendedPubKey: string) => {
  const keyPrefix = Object.keys(networkAndScriptMap).find(
    (each) => extendedPubKey.slice(0, 4) === each
  );

  if (keyPrefix) {
    return networkAndScriptMap[keyPrefix];
  }
  throw new Error("Unknown network or script Type");
};

export const detectNetworkAndScriptTypeByAddress = (address: string) => {
  // Mainnet
  if (address.startsWith("1")) {
    return {
      network: BitcoinNetwork.Main,
      scriptType: BitcoinScriptType.P2PKH,
    };
  }

  if (address.startsWith("3")) {
    return {
      network: BitcoinNetwork.Main,
      scriptType: BitcoinScriptType.P2SH_P2WPKH,
    };
  }

  if (address.startsWith("bc1q")) {
    return {
      network: BitcoinNetwork.Main,
      scriptType: BitcoinScriptType.P2WPKH,
    };
  }

  if (address.startsWith("bc1p")) {
    return {
      network: BitcoinNetwork.Main,
      scriptType: BitcoinScriptType.P2TR,
    };
  }

  // Testnet
  if (address.startsWith("m") || address.startsWith("n")) {
    return {
      network: BitcoinNetwork.Test,
      scriptType: BitcoinScriptType.P2PKH,
    };
  }

  if (address.startsWith("2")) {
    return {
      network: BitcoinNetwork.Test,
      scriptType: BitcoinScriptType.P2SH_P2WPKH,
    };
  }

  if (address.startsWith("tb1q")) {
    return {
      network: BitcoinNetwork.Test,
      scriptType: BitcoinScriptType.P2WPKH,
    };
  }

  if (address.startsWith("tb1p")) {
    return {
      network: BitcoinNetwork.Test,
      scriptType: BitcoinScriptType.P2TR,
    };
  }

  throw new Error("Unknown network or script Type");
};

export const EXTENDED_PUBKEY_PATH = {
  [BitcoinNetwork.Main]: {
    [BitcoinScriptType.P2PKH]: "M/44'/0'/0'",
    [BitcoinScriptType.P2SH_P2WPKH]: "M/49'/0'/0'",
    [BitcoinScriptType.P2WPKH]: "M/84'/0'/0'",
    [BitcoinScriptType.P2TR]: "M/86'/0'/0'",
  },
  [BitcoinNetwork.Test]: {
    [BitcoinScriptType.P2PKH]: "M/44'/1'/0'",
    [BitcoinScriptType.P2SH_P2WPKH]: "M/49'/1'/0'",
    [BitcoinScriptType.P2WPKH]: "M/84'/1'/0'",
    [BitcoinScriptType.P2TR]: "M/86'/1'/0'",
  },
};

export const NETWORK_SCRIPT_TO_COIN: Record<
  BitcoinNetwork,
  Record<BitcoinScriptType, SupportedCoins>
> = {
  [BitcoinNetwork.Main]: {
    [BitcoinScriptType.P2PKH]: SupportedCoins.BTC_LEGACY,
    [BitcoinScriptType.P2SH_P2WPKH]: SupportedCoins.BTC,
    [BitcoinScriptType.P2WPKH]: SupportedCoins.BTC_NATIVE_SEGWIT,
    [BitcoinScriptType.P2TR]: SupportedCoins.BTC_TAPROOT,
  },
  [BitcoinNetwork.Test]: {
    [BitcoinScriptType.P2PKH]: SupportedCoins.BTC_TESTNET_LEGACY,
    [BitcoinScriptType.P2SH_P2WPKH]: SupportedCoins.BTC_TESTNET_SEGWIT,
    [BitcoinScriptType.P2WPKH]: SupportedCoins.BTC_TESTNET_NATIVE_SEGWIT,
    [BitcoinScriptType.P2TR]: SupportedCoins.BTC_TESTNET_TAPROOT,
  },
};
