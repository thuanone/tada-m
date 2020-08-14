/**
 * IBM Confidential
 * Licensed Materials - Property of IBM
 * IBM Cloud Container Service, 5737-D43
 * (C) Copyright IBM Corp. 2017, 2019 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

import * as loggerUtil from '@console/console-platform-log4js-utils';
const logger = loggerUtil.getLogger('clg-ui:utils-routes');

import * as nodeRequest from 'request';
import * as URI from 'urijs';

import * as launchdarkly from '../services/launchdarkly-service';
import * as request from './request-utils';

// Export the "private" methods for unit testing
const _: {
  [key: string]: any
} = {};

_.isEmpty = (value) => value === undefined || value === null || value === '';
_.printResponseBody = (body) => {
  if (_.isEmpty(body)) { return 'null'; }
  if (typeof body === 'string') { return body.replace(/\n/g, ''); }
  return JSON.stringify(body);
};

export function getUserId(req, useId?) {
  if (!req || !req.user) { return '[no user session]'; }
  if (useId) { return req.user.iam_id || '[no iam id]'; }
  return req.user.username
    || (req.user.emails && req.user.emails.length > 0 && req.user.emails[0].value)
    || req.user.iam_id
    || req.user.id
    || '[no user id]';
}

_.getServiceName = (url) => {
  if (!url) { return null; }
  const uri = new URI(url);
  const host = uri.hostname();
  const path = uri.pathname();
  if (host.startsWith('containers.')) { return 'armada-api'; } else if (path.endsWith('/datalayer/resource_list')) { return 'datalayer'; } else if (host.includes('icr.io')) { return 'registry'; } else if (host.startsWith('iam.')) { return 'iam'; } else if (host.startsWith('pricing-catalog.')) { return 'bss-pricing'; } else if (host.startsWith('billing.')) { return 'bss-billing'; } else if (host.includes('.kms.')) { return 'key-protect'; } else if (host.startsWith('razeedash.')) { return 'razee'; } else if (host.startsWith('resource-catalog.')) { return 'resource-catalog'; }
  return null;
};

export function logRequest(req, options, status, error, body?) {
  const headers = {};
  ['X-Region', 'X-Origin', 'Account', 'account-id', 'bluemix-instance', 'X-Auth-Resource-Account'].forEach((h) => {
    if (options.headers && options.headers[h]) { headers[h] = options.headers[h]; }
  });
  const out = [];
  if (status >= 500 && status < 600) {
    out.push('5XX_SERVICE_DOWN');
    const service = _.getServiceName(options.url);
    if (service) { out.push(`(${service})`); }
  }
  out.push(getUserId(req, true));
  out.push('>>>');
  out.push(options.method);
  out.push(options.url);
  if (Object.keys(headers).length > 0) { out.push(JSON.stringify(headers)); }
  if (options.body) { out.push(JSON.stringify(options.body)); }
  out.push('<<<');
  out.push(status);
  if (error) { out.push(error.toString()); }
  if (body) { out.push(_.printResponseBody(body)); }
  logger.error(out.join(' '));
}

export function getCommonHeaders(req) {

  return {
  'Connection': 'keep-alive',
  'X-Origin': (req.headers && req.headers['x-request-origin']) || undefined,
  'accept-language': req.i18n.language,
  'user-agent': 'cloud-functions',
  };
}

const getIamAuthHeaders = (req, res) => {
  const auth = res.locals.auth;
  return Object.assign(getCommonHeaders(req), {
    Authorization: auth.iamToken,
  });
};

const getClusterApiHeaders = (req, res) => {
  const auth = res.locals.auth;
  return Object.assign(getIamAuthHeaders(req, res), {
    'X-Auth-Refresh-Token': auth.refreshToken,
    'X-Auth-Resource-Group': auth.resourceGroup,
    'X-Region': auth.region,
  });
};

const getApi = (v = 'v1') => `${process.env.containersUrl}/${v}`;
const getGlobalApi = () => `${process.env.containersUrl}/global/v1`;

const send = (req, res, options, callback) => {
  const opts = Object.assign({
    headers: getClusterApiHeaders(req, res),
    json: true,
    method: 'GET',
    timeout: 60000,
  }, options);
  request(opts, (error, response, body) => {
    const status = response && response.statusCode || 500;
    if (!error && status === 200) {
      callback(null, body);
    } else {
      logRequest(req, opts, status, error, body);
      callback(new Error('Request failed'));
    }
  });
};

/**
 * Generic API request method that adds the necessary auth headers and proxies to
 * whatever URL is specified and logs the details of all failed requests. The only
 * required query parameter is the url. The auth headers included on the request
 * are determined by the `auth` query parameter.
 * @param {Object} req
 * @param {Object} res
 */
const apiProxy = (req, res) => {
  if (!req.query.url) {
    logRequest(req, {}, 400, 'Missing proxy URL');
    res.sendStatus(400);
    return;
  }
  // only allow proxying to other URLs within the console
  const uri = new URI(req.query.url);
  if (!/(localhost|bluemix\.net|cloud\.ibm\.com)$/.test(uri.hostname())) {
    logRequest(req, {}, 400, `Bad proxy URL: ${req.query.url}`);
    res.sendStatus(400);
    return;
  }

  let headers = null;
  if (req.query.auth === 'armada') { headers = getClusterApiHeaders(req, res); } else if (req.query.auth === 'iam' || req.query.auth === 'account') { headers = getIamAuthHeaders(req, res); } else { headers = getCommonHeaders(req); }
  const options = {
    body: undefined,
    headers,
    json: true,
    method: req.query.method || req.method,
    timeout: 60000,
    url: req.query.url,
  };
  if (req.body) { options.body = req.body; }
  request(options, (error, response, body) => {
    const status = response && response.statusCode || 500;
    if (!error && status >= 200 && status < 300) {
      res.status(status).json(res.locals.formatter ? res.locals.formatter(body) : body);
    } else {
      logRequest(req, options, status, error, body);
      if (body) {
        res.status(status).json(body);
      } else {
        res.sendStatus(status);
      }
    }
  });
};

// Call a remote web page and get the status code
const pageCheck = (req, res) => {
  const options = {
    headers: getClusterApiHeaders(req, res),
    method: 'GET',
    timeout: 60000,
    url: req.query.url,
  };
  nodeRequest(options, (error, response, body) => {
    const data: any = {
      status: response && response.statusCode || 500,
    };
    if (body && body.charAt(0) === '{') {
      try {
        body = JSON.parse(body);
        if (body.code) { data.status = body.code; }
      } catch (e) { /* */ }
    }
    const requestId = response && response.headers['x-request-id'];
    if (requestId) { data.requestId = requestId; }
    res.json(data);
  });
};

const sendRequest = (req, res, opt, format) => {
  const options = Object.assign({
    json: true,
    method: 'GET',
    timeout: 60000,
  }, opt);
  request(options, (error, response, body) => {
    const status = response && response.statusCode || 500;
    if (!error && status >= 200 && status < 300) {
      res.status(status).json(format ? format(body) : body);
    } else {
      logRequest(req, options, status, error, body);
      if (body) {
        res.status(status).json(body);
      } else {
        res.sendStatus(status);
      }
    }
  });
};

/**
 * Check whether this user is allowed to access the given feature flag
 */
export function verifyFeatureFlag(featureFlagName, req, res, next) {
  launchdarkly.getFlag(req, featureFlagName, (value) => {
    if (value === true) {
      next();
    } else {
      res.sendStatus(403);
      return;
    }
  });
}

module.exports = {
  _,
  apiProxy,
  getApi,
  getClusterApiHeaders,
  getCommonHeaders,
  getGlobalApi,
  getIamAuthHeaders,
  getUserId,
  logRequest,
  pageCheck,
  request: sendRequest,
  send,
  verifyFeatureFlag,
};
