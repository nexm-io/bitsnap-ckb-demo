import { types } from 'mobx-state-tree';
import { BitcoinNetwork, BitcoinScriptType } from '../utils/interface';

export const settingsInitialState = {
  network: BitcoinNetwork.Main,
  scriptType: BitcoinScriptType.P2WPKH,
};

const Settings = types
  .model('Settings', {
    network: types.enumeration(Object.values(BitcoinNetwork)),
    scriptType: types.enumeration(Object.values(BitcoinScriptType)),
    changeAddress: types.optional(types.boolean, false),
  })
  .actions((self) => ({
    setNetwork: (network: BitcoinNetwork) => {
      self.network = network;
    },
    setScriptType: (scriptType: BitcoinScriptType) => {
      self.scriptType = scriptType;
    },
  }));

export default Settings;
