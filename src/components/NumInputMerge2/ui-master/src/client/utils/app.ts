import * as CarbonComponentsReact from '@console/pal/carbon-components-react';
import CarbonIcons from 'carbon-icons';
import React from 'react';
import ReactDom from 'react-dom';
import utils from '../api/utils';
import { init as i18nInit } from './i18n';
import t from './i18n';
import { pageEvent } from './segment';
import win from './window';

const env = window.armada;
const config = env.config;

interface ILocalStorage {
  key: (index: number) => string;
  length: number;
  getItem: (key: string) => string;
  removeItem: (key: string) => void;
}

interface ITestInterface {
  cleanLocalStorage: () => any;
  exposeGlobalLibs: () => any;
}

// Export the "private" methods for unit testing
const _: ITestInterface = {
  // Clean up expired local storage
  cleanLocalStorage: () => {
    try {
      const storage: ILocalStorage = win.get('localStorage');
      const now = new Date().getTime();
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (/^bluemix_ui:v1:/.test(key)) {
          const value = JSON.parse(storage.getItem(key));
          // Clear storage if it's expired
          if (value && value.expires && value.expires < now) {
            storage.removeItem(key);
          }
        }
      }
    } catch (e) {
      console.error('Error cleaning up local storage:', e);
    }
  },

  exposeGlobalLibs: () => {
    window.armada.libs = {
      CarbonComponentsReact,
      CarbonIcons,
      React,
      ReactDom,
    };
  },
};

const init = (Component) => {
  _.exposeGlobalLibs();

  // Convert any boolean string flags to actual booleans
  Object.keys(env).forEach((k) => {
    const value = env[k];
    if (value === 'true') {
      env[k] = true;
    } else if (value === 'false') {
      env[k] = false;
    }
  });

  // Prepare translation and then render the app
  i18nInit().then(() => {
    ReactDom.render(Component, document.getElementById('container'));
  });

  // When switching accounts, if the user is viewing a resource associated with an account
  // then navigate back to the top level page, otherwise reload the current page. In either
  // case we make a request to the server so that the selected account is persisted in the
  // user session before the page is reloaded.
  document.addEventListener('acctChanged', () => {
    $('#container').addClass('wait');
    utils.doGet({ url: config.proxyRoot }).always(() => {
      const path = win.get('location.pathname').replace(/\/$/, '').replace(/^\/[^\/]+\//, '').split('/');
      if (path[0] === 'clusters' && path.length > 1) {
        win.set('location', `${config.proxyRoot}clusters`);
      } else if (path[0] === 'catalog' && path[1] === 'cluster' && path[2] !== 'create') {
        win.set('location', `${config.proxyRoot}clusters`);
      } else if (path[0] === 'registry' && path[1] !== 'main') {
        win.set('location', `${config.proxyRoot}registry/main/images`);
      } else {
        win.get('location').reload();
      }
    });
  });

  _.cleanLocalStorage();
};

export const setPageTitle = (pageTitle: string, titleParams?: any) => {
  // set the page title
  document.title = t('clg.page.title', { title: t(pageTitle, titleParams || {}) });
};

/**
 * This helper function triggers common actions once the user arrived on the page (e.g. it updates the document title)
 * @param pageTitle the NLS key that shall be used for this page
 */
const arrivedOnPage = (pageTitle: string, titleParams?: any) => {
  // scroll to the top of the page
  window.scrollTo(0, 0);

  // track the event via segment
  pageEvent('Offering Interface', pageTitle);

  // set the page title
  setPageTitle(pageTitle, titleParams);
};

export default { arrivedOnPage, init, setPageTitle, _ };
