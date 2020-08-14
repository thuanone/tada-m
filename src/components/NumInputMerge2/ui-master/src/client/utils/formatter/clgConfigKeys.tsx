import React from 'react';

import * as configModel from '../../../common/model/config-model';

function getKeys(configItem: configModel.IUIGenericSecret | configModel.IUIConfigMap) {
  const keys = [];
  if (configItem.data) {
    for (const keyvalueItem of configItem.data) {
      keys.push(keyvalueItem.key);
    }
  }
  return keys;
}

export function render(configItem: configModel.IUIGenericSecret | configModel.IUIConfigMap) {
  if (!configItem) {
    return <span>-</span>;
  }

  const keys = getKeys(configItem);

  // check if this configItem has some keys
  if (keys && keys.length > 0) {
    return <span>{keys.join(', ')}</span>;
  }

  return <span>-</span>;
}

export function value(configItem: configModel.IUIGenericSecret | configModel.IUIConfigMap) {
  let keysStr = '';

  const keys = getKeys(configItem);

  // check if this configItem has some keys
  if (keys && keys.length > 0) {
    for (const key of keys) {
      keysStr += ` ${key}`;
    }
  }
  return keysStr.trim();
}
