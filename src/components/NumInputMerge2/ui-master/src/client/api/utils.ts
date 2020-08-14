// 3rd-party
import * as log from 'loglevel';

import { UnknownError } from './../../common/Errors';

import context from '../utils/context';
import csrf from '../utils/csrf';
import win from '../utils/window';
import { UIRequestError } from './../../common/model/common-model';

const COMPONENT = 'api/utils';
const logger = log.getLogger(COMPONENT);

interface ITestExports {
  createAjaxObject: (method, options) => any;
  createResponse: (data) => any;
  getLocal: (key, cacheBust) => any;
  setLocal: (key, data, hours) => any;
}

declare global {
  // tslint:disable-next-line:interface-name
  interface Window {
    storage: {
      ready: (callback) => any,
      getItem: (key, options?) => any,
      setItem: (key, data, options?) => any,
      removeItem: (key) => any,
      getStorage: (flag?: boolean) => any,
      getStorageKey: (key) => string
    };
  }
}

$.ajaxSetup({
  cache: false,
  dataFilter: (data, dataType) => {
    if (dataType === 'json' && typeof data === 'string'
      && !(data.substr(0, 1) === '{' || data.substr(0, 1) === '[')) {
      return null;
    }
    return data;
  },
});

// Responses from GET requests are cached for a short time, but the entire cache is
// cleared on any kind of update request (POST, PUT, DELETE).
const cache = {};
const cacheAge = 1000 * 30; // 30 seconds

// The key is created using the properties that make a request unique. Note that the
// account is not included here because the cache would not persist between account
// changes due to page reload.
const getCacheKey = (options) => `${options.url}-${options.headers['x-auth-region']}-${options.headers['x-auth-metro']}-${options.headers['x-auth-resource-group']}`;

const save = (options, result) => {
  const key = getCacheKey(options);
  cache[key] = {
    clearTimeout: win.timeout(() => {
      delete cache[key];
    }, cacheAge),
    result,
  };
};

const getCachedResult = (key) => cache[key] && cache[key].result;

const clearCache = () => {
  Object.keys(cache).forEach((key) => {
    cache[key].clearTimeout();
    delete cache[key];
  });
};

const abortAll = (xhrs) => {
  xhrs.forEach((x) => x.abort());
};

const all = (xhrs, callback, errback, always) => {
  const results = [];
  let pending = xhrs.length;
  let failed = false;
  xhrs.forEach((x, i) => {
    x.done((data) => {
      results[i] = data;
      pending -= 1;
      if (pending === 0) {
        callback(results);
        if (always) {
          always();
        }
      }
    });
    x.fail((xhr) => {
      if (!failed) {
        failed = true;
        abortAll(xhrs);
        errback(xhr);
        if (always) {
          always();
        }
      }
    });
  });
};

const getAccountHeaders = (callback) => {
  context.getAccountData((data) => {
    const accountHeaders = {
      'Account': data && (data.selectedAccountGuid || (data.account && data.account.accountGuid)),
      'x-auth-account-id': data && (data.selectedAccountGuid || (data.account && data.account.accountGuid)),
      'x-auth-ims-account-id': data && data.account && data.account.softlayerAccountId,
    };
    callback(accountHeaders);
  });
};

// Export the "private" methods for unit testing
const _: ITestExports = {
  createAjaxObject: (method, options) => {
    const done = [];
    const fail = [];
    const always = [];
    let ajaxObject;
    let cachedResult;
    let abortRequest;

    const commonFail = (xhr) => {
      // If the response came back as a failure with code set to "iam" then that tells us the request
      // failed in IAM and probably the only way we can recover is to restart auth. So instead of
      // giving the user an error page just log them out.
      if (xhr.responseJSON && xhr.responseJSON.code === 'iam') {
        win.set('location', '/logout');
      }
    };

    const fakeAjaxObject = {
      abort: () => {
        if (ajaxObject) {
          ajaxObject.abort();
        } else {
          abortRequest = true;
        }
      },
      always: (cb) => {
        if (ajaxObject) {
          ajaxObject.always(cb);
        } else if (cachedResult && cb) {
          cb();
        } else if (cb) {
          always.push(cb);
        }
        return fakeAjaxObject;
      },
      done: (cb) => {
        if (ajaxObject) {
          ajaxObject.done(cb);
        } else if (cachedResult && cb) {
          cb(cachedResult);
        } else if (cb) {
          done.push(cb);
        }
        return fakeAjaxObject;
      },
      fail: (cb) => {
        if (ajaxObject) {
          ajaxObject.fail(cb);
        } else if (cb) {
          fail.push(cb);
        }
        return fakeAjaxObject;
      },
      isFake: true,
    };

    getAccountHeaders((accountHeaders) => {
      if (abortRequest) {
        return;
      }
      const opts = Object.assign({
        contentType: 'application/json',
        dataType: 'json',
        headers: Object.assign({
          'accept': 'application/json',
          'csrf-token': csrf.getCsrfToken(),
          'x-auth-metro': context.getMetro(),
          'x-auth-region': context.getRegion(),
          'x-auth-resource-group': context.getResourceGroup(),
          'x-request-origin': window.location.href,
        }, accountHeaders, (options && options.headers) || {}),
        method,
      }, options);

      if (opts.method === 'GET') {
        // check whether a flag is set,
        // that that forces us to bypass the in-memory cache
        if (!opts.bypass_inmemory_cache) {
          cachedResult = getCachedResult(getCacheKey(opts));
          if (cachedResult) {
            return;
          }
        }
      } else {
        clearCache();
      }

      ajaxObject = $.ajax(opts).done((result) => {
        if (opts.method === 'GET') {
          save(opts, result);
        }
      }).done((r) => done.forEach((d) => d(r))).fail(commonFail).fail((e) => fail.forEach((f) => f(e))).always(() => always.forEach((a) => a()));
    });

    return ajaxObject || fakeAjaxObject;
  },
  createResponse: (data) => {
    const response = {
      abort: () => {
        return null;
      },
      always: (cb) => {
        if (cb) {
          cb();
        }
        return response;
      },
      done: (cb) => {
        if (cb) {
          cb(data);
        }
        return response;
      },
      fail: () => response,
    };
    return response;
  },
  getLocal: (key, cacheBust) => {
    try {
      if (cacheBust) {
        const fullKey = window.storage.getStorageKey(key);
        const item = JSON.parse(window.storage.getStorage(true).getItem(fullKey));
        if (item.time < cacheBust) {
          window.storage.removeItem(key);
          return null;
        }
      }
      return window.storage.getItem(key, { local: true });
    } catch (e) {
      return null;
    }
  },
  setLocal: (key, data, hours) => {
    try {
      const expires = new Date();
      expires.setHours(expires.getHours() + hours);
      window.storage.setItem(key, data, { local: true, expires: expires.getTime() });
    } catch (e) {
      /* oh well, we tried */
    }
  },
};

/**
 * Transform the ajax response of a failed request
 * @param jqXhr - the jQuery XHR object that contains the status and the responseText
 */
const transformErrorResponse = (jqXhr): UIRequestError => {

  if (jqXhr && jqXhr.responseJSON) {
    const requestError: UIRequestError = jqXhr.responseJSON;
    return requestError;
  }

  let errorMessage;
  if (jqXhr && jqXhr.responseText) {
    // check whether the response contains a HTML string
    if (jqXhr.responseText.startsWith('<html')) {
      let message = jqXhr.responseText.replace(/(\r\n|\n|\r|\\n)/gm, '');
      if (jqXhr.responseText.indexOf('<title>') > -1) {
        const regex = /<title>(.*?)<\/title>/g;
        const matched = regex.exec(jqXhr.responseText);
        if (matched && matched[1]) {
          message = matched[1];
        }
      }
      errorMessage = message;
    } else {

      try {
        // try to map the server response
        const parsedRequestError: UIRequestError = JSON.parse(jqXhr.responseText);
        return parsedRequestError;
      } catch (parserError) {
        logger.error(`Error while parsing the response to a known IUIRequestError type: jqXhr.responseText: '${jqXhr.responseText}'`, parserError);
      }
    }
  }

  // in case of an error that happened during evaluation of the XHR response, we return a generic unknown error object
  const fallbackErr: UIRequestError = new UIRequestError(undefined, jqXhr.status, Date.now(), new UnknownError(undefined, errorMessage));
  return fallbackErr;
};

const doGetAndStore = (key, hours, cacheBust, options) => {
  const data = _.getLocal(key, cacheBust);
  if (data) {
    return _.createResponse(data);
  }
  return _.createAjaxObject('GET', options).done((result) => {
    _.setLocal(key, result, hours);
  });
};

const doGet = (options) => _.createAjaxObject('GET', options);
const doPut = (options) => _.createAjaxObject('PUT', options);
const doPost = (options) => _.createAjaxObject('POST', options);
const doDelete = (options) => _.createAjaxObject('DELETE', options);
const doPatch = (options) => _.createAjaxObject('PATCH', options);

export default { _, all, doGet, doPut, doPost, doDelete, doPatch, doGetAndStore, transformErrorResponse };
