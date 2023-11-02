import { observer } from 'mobx-react-lite';
import React, { Fragment, FunctionComponent, ReactNode } from 'react';

export const PersistGate: FunctionComponent<{
  store: any;
  children: ReactNode;
}> = observer((props) => {
  return <Fragment>{props.store._rehydrated ? props.children : null}</Fragment>;
});
