export enum BitcoinNetwork {
  Main = "mainnet",
  Test = "testnet",
}

export enum CkbNetwork {
  Main = "mainnet",
  Test = "testnet",
  Dev = "devnet",
}

export enum BitcoinScriptType {
  P2PKH = "P2PKH",
  P2SH_P2WPKH = "P2SH-P2WPKH",
  P2WPKH = "P2WPKH",
  P2TR = "P2TR",
}

export enum BitcoinUnit {
  BTC = "BTC",
  Sats = "sats",
  Currency = "Currency",
}

export enum WalletType {
  BitcoinWallet = "bitcoinWallet",
  LightningWallet = "lightningWallet",
}
