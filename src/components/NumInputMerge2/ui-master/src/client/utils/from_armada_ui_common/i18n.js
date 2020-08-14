import { useState } from 'react';
import i18next from 'i18next';

const promises = {};
const isTest = typeof window !== 'undefined' && window.armada && window.armada.unitTests;
const isEnglish = typeof window !== 'undefined' && window.armada && /^en/.test(window.armada.lng);

const mock = (key, options) => {
  if (!options) return key;
  Object.keys(options).forEach(v => (key = key.replace(new RegExp(`{{(- )?${v}}}`, 'g'), () => options[v])));
  return key;
};

const initial = moduleName => {
  if (isTest) return mock;
  return key => console.warn(`Cannot translate ${key}. You will need to init this module first. [${moduleName}]`);
};

const createInstance = responseData => {
  const data = responseData.payload;
  let lng = null;
  let resources = null;
  if (data && data.lng) {
    lng = data.lng.replace('-', '_');
    resources = {};
    resources[lng] = {
      translation: data.bundle,
    };
  }
  return i18next.createInstance().init({
    resources,
    lng,
    nsSeparator: false,
    keySeparator: false,
  });
};

const fetchLanguageBundle = url => {
  const opts = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  };
  return fetch(url, opts)
    .then(result => {
      if (result.ok) return result.json().then(createInstance);
      throw new Error(`${result.status} ${result.statusText}`);
    })
    .catch(err => {
      console.error('i18n:fetchLanguageBundle - Unable to fetch coligo-ui language bundle',  );
      return createInstance();
    });
};

const init = (url = '/codeengine/locale?namespace=common', skip = isEnglish) => {
  if (!promises[url]) promises[url] = skip ? createInstance() : fetchLanguageBundle(url);
  return promises[url];
};

export const useTranslation = (url, skip) => {
  if (isTest) return mock;
  const [t, setTranslationFunction] = useState();
  if (t) return t;
  init(url, skip).then(tx => {
    setTranslationFunction(() => tx);
  });
  return t;
};

export default { init, mock, initial };
