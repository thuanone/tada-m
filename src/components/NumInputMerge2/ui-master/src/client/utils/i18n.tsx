import React from 'react';

// This module allows us to continue to use the `t` function as a global utility,
// provided it is initialized before loading the app. The nice thing about this is
// that we don't need to change all of the other components and utilities that use
// this function. The bad thing is that this will require a request to fetch the
// string bundle before we can load any content, for any browser with a locale set
// to anything other than en.
import i18nUtils from './from_armada_ui_common/i18n';

declare global {
  // tslint:disable-next-line:interface-name
  interface Window { armada: any; }
}

const proxyRoot = window.armada.config.proxyRoot;

let tFunc;
export const t = (key, options?: any | boolean): string => {
  if (window.armada.unitTests) {
    tFunc = i18nUtils.mock;
  }

  if (tFunc) {
    return tFunc(key, options);
  }
  console.warn(`Cannot translate "${key}". Initialize i18n first.`);
  return key;
};

export const tHtml = (key, options?: any | boolean): any => {
  return <React.Fragment><span dangerouslySetInnerHTML={{__html: t(key, options)}} /></React.Fragment>;
};

export const init = async () => i18nUtils.init(`${proxyRoot}locale`, false).then((result) => (tFunc = result));

export default t;
