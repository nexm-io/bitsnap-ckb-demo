export enum BitcoinNetwork {
  Main = 'mainnet',
  Test = 'testnet',
}

export enum BitcoinScriptType {
  P2PKH = 'P2PKH',
  P2SH_P2WPKH = 'P2SH-P2WPKH',
  P2WPKH = 'P2WPKH',
}

export enum BitcoinUnit {
  BTC = 'BTC',
  Sats = 'sats',
  Currency = 'Currency',
}

export enum WalletType {
  BitcoinWallet = 'bitcoinWallet',
  LightningWallet = 'lightningWallet',
}
