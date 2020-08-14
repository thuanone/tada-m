/**
 * IBM Confidential
 * Licensed Materials - Property of IBM
 * IBM Cloud Container Service, 5737-D43
 * (C) Copyright IBM Corp. 2018 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

import aceUtils = require('@console/console-platform-bluemix-utils');
import crequest = require('@console/console-platform-cached-request');
import loggerUtil = require('@console/console-platform-log4js-utils');
import launchdarkly = require('../services/launchdarkly-service');
const logger = loggerUtil.getLogger('clg-ui');
import nconf = require('@console/console-platform-nconf');
import URL = require('url');
import utils = require('./routes-utils');
import statics = require('./statics-utils');

const flags = [
  'coligo-ui-feature-projectexpiration',
  'coligo-ui-feature-icr',
];

// istanbul ignore next
const getConfigEnv = () => process.env.CONSOLE_ENV || 'stage';

// Create client config object that includes only those config properties that we
// want to make available to the client.
const clientConfig: any = {
  docs: nconf.get('docs'),
  proxyRoot: nconf.get('proxyRoot'),
};

// Generate the static file paths at startup for production
// istanbul ignore next
if (process.env.NODE_ENV !== 'development') { statics.getColigoStatics(); }

const headerRequest = (urls, req, resolve, reject) => {
  const send = (tries) => {
    crequest.getAndPost(urls, req, (err, body) => {
      if (err) {
        if (tries > 1) {
          send(tries - 1);

          // removed the following line, due to problems with the unit tests
          // setTimeout(() => { send(tries - 1); }, 2000);
        } else { reject(err); }
      } else {
        resolve(body);
      }
    });
  };
  send(3);
};

const getExternalContent = (req, headerUrls, analyticsUrls, featureFlags, callback) => {
  Promise.all([
    // If this fails then we can't render the page
    new Promise((resolve, reject) => {
      headerRequest(headerUrls, req, resolve, reject);
    }),
    // If this fails then we don't want to stop rendering the page
    new Promise((resolve) => {
      crequest.get(analyticsUrls, req, (err, body) => {
        if (err) {
          const message = err.message
            ? err.message
            : (`One of the URL requests cannot complete.\n\n${JSON.stringify(analyticsUrls)}`);
          logger.error(`Error: ${message}`);
          resolve();
        } else {
          resolve(body);
        }
      });
    }),
    // If this fails then we don't want to stop rendering the page
    new Promise((resolve) => {
      launchdarkly.getFlag(req, featureFlags, resolve);
    }),
  ]).then((results) => {
    callback(null, results[0], results[1], results[2]);
  }, (err) => {
    callback(err);
  });
};

export function renderView(req, res, template, options: any = {}) {
  const config = nconf.get();
  const aceProxyUrl = aceUtils.getAceProxyUrl(req, true);
  const commonApiPath = `${aceProxyUrl}/api/v6`;
  const commonApiRequests = [
    { url: `${commonApiPath}/files`, method: 'GET' },
    { url: `${commonApiPath}/header?taxonomyNavigation=containers&state=${req.url.replace(config.contextRoot, config.proxyRoot)}`, method: 'GET' },
  ];
  const analyticsUrls = [
    `${aceProxyUrl}/analytics/files`,
  ];
  const useragent = req.useragent;
  const os = (useragent.isWindows) ? 'windows' : 'linux';
  const variables = Object.assign({
    coligoUsabillaEnabled: nconf.get('coligoUsabillaDisabled') !== 'true',
    commonHeaderCss: 'header-with-filters.css',
    commonHeaderJs: 'common-header.js',
    config: encodeURIComponent(JSON.stringify(clientConfig)),
    consoleEnv: process.env.CONSOLE_ENV,
    containersUrl: process.env.containersUrl,
    csrfToken: req.csrfToken && req.csrfToken(),
    integrationTests: !!(req.cookies && req.cookies.armada_ui_integration_tests),
    isAuthenticated: req.isAuthenticated(),
    lng: req.i18n.language,
    nodeEnv: process.env.NODE_ENV,
    os,
    proxyRoot: config.proxyRoot,
    segmentKey: process.env.SEGMENT_KEY,
    staticFileMap: encodeURIComponent(JSON.stringify(statics.getColigoStatics())),
    statics: statics.getColigoStatics(),
    userEmail: utils.getUserId(req),
  }, options.variables || {});

  getExternalContent(req, commonApiRequests, analyticsUrls, flags, (err, commonBody, analyticsBody, featureFlags) => {
    if (!err) {
      try {
        variables.aceCommonFiles = JSON.parse(commonBody[0]);
      } catch (e) {
        logger.error('Cannot parse ace common files: %s', commonBody[0], e);
      }
      if (analyticsBody && variables.nodeEnv !== 'development') {
        try {
          variables.aceAnalyticsFiles = JSON.parse(analyticsBody[0]);
        } catch (e) {
          logger.error('Cannot parse result of %s: %s', analyticsUrls[0], analyticsBody[0], e);
        }
      }
      variables.header = commonBody[1];
      variables.flags = encodeURIComponent(JSON.stringify(featureFlags));
      res.render(template, variables);
    } else {
      const msg = err.message
        ? `Error: ${err.message}`
        : `One of the URL requests cannot complete.\n\n${JSON.stringify(commonApiRequests)}`;
      logger.error(msg);
      res.send(msg);
    }
  });
}

export function getFlags() {
  return flags;
}

export function basicView(req, res) {
  return renderView(req, res, 'basic.dust');
}
