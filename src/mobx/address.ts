import { IAnyModelType, types } from 'mobx-state-tree';
import Account from './account';
import { Coins } from '../utils/supportedCoins';

const Address = types.model('Address', {
  id: types.identifier,
  address: types.string,
  parent: types.reference(types.late((): IAnyModelType => Account)),
  coinCode: types.enumeration(Coins),
  change: types.number,
  index: types.number,
});

export default Address;
