/**
 * IBM Confidential
 * Licensed Materials - Property of IBM
 * IBM Cloud Container Service, 5737-D43
 * (C) Copyright IBM Corp. 2017, 2018 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

import loggerUtil = require('@console/console-platform-log4js-utils');
import request = require('request');
const logger = loggerUtil.getLogger('clg-ui');

const tryCount = 3;
const retryTimeout = 2000;

const serverError = (res) => {
  if (res && res.statusCode && ((res.statusCode >= 500 && res.statusCode < 600) || res.statusCode === 429)) {
    return res.statusCode;
  }
  return null;
};
const networkError = (err) => {
  if (err && err.code && [
    'ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'EHOSTUNREACH', 'EPIPE', 'EAI_AGAIN', 'ESOCKETTIMEDOUT', 'ETIMEDOUT',
  ].indexOf(err.code) > -1) {
    return err.code;
  }
  return null;
};

const sendRequest = (options, callback) => {
  const send = (tries) => {
    request(options, (error, response, body) => {
      const code = serverError(response) || networkError(error);
      if (code && tries > 1) {
        logger.warn(`Request returned code ${code}, retrying: ${options.method} ${options.url}`);
        setTimeout(() => send(tries - 1), retryTimeout);
      } else {
        callback(error, response, body);
      }
    });
  };
  send(tryCount);
};

export = sendRequest;
