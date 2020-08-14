/**
 * IBM Confidential
 * Licensed Materials - Property of IBM
 * IBM Cloud Container Service, 5737-D43
 * (C) Copyright IBM Corp. 2017, 2019 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

// We need to make sure iamCookieClientId (or CLOUD_IAM_COOKIE_CLIENT_ID) is not set
// in production otherwise it will mess up the IAM cookie.
// istanbul ignore next
if (process.env.iamCookieClientId) { delete process.env.iamCookieClientId; }
// istanbul ignore next
if (process.env.CLOUD_IAM_COOKIE_CLIENT_ID) { delete process.env.CLOUD_IAM_COOKIE_CLIENT_ID; }

// TODO: Remove the CONSOLE_ENV env var. For now create it based on bluemixHost.
// istanbul ignore next
process.env.CONSOLE_ENV = /(stage1|test)/.test(process.env.bluemixHost || 'test') ? 'stage' : 'prod';

// TODO: Update some console libs to get rid of dependency on cfDomain env var
process.env.cfDomain = process.env.bluemixHost;

/* eslint-disable global-require */
import * as loggerUtil from '@console/console-platform-log4js-utils';
loggerUtil.configure('config', false);
const logger = loggerUtil.getLogger('clg-ui');
import * as expressSetup from '@console/console-platform-express-setup';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as useragent from 'express-useragent';
import * as fs from 'fs-extra';
import * as helmet from 'helmet';
import { verifyFeatureFlag } from './utils/routes-utils';

/*
 Adds dns caching to node dns module.
 All following DNS look-ups will be cached and re-used automatically.
 Takes optional TTL in milliseconds as the only configration argument.
*/
import dnsCache = require('dns-cache');
dnsCache(10000);

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Load language bundles. We do it this way so that we can use i18next without needing to have a
// namespace in our bundle keys. If we let i18next load the bundles it will require a namespace.
const languageBundles = {};
fs.readdirSync(`${__dirname}/locales`).forEach((lng) => {
  languageBundles[lng] = { translation: fs.readJsonSync(`${__dirname}/locales/${lng}/coligo-resources.json`) };
  logger.trace(`loaded bundle '${lng}': clg.common.label.create=${languageBundles[lng].translation['clg.common.label.create']}`);
});
logger.info(`language bundles: ${JSON.stringify(Object.keys(languageBundles))}`);

// tslint:disable-next-line: no-shadowed-variable
const configRoutes = (app, contextRoot, { checkAuthRoute, clearSessionCookieIfExpired }) => {
  // These modules should not be loaded until the config has been loaded
  // (which happens in express-setup).

  // eslint-disable-next-line import/no-unresolved
  const viewUtils = require('./utils/view-utils');
  const utils = require('./utils/routes-utils');
  const auth = require('./endpoints/auth-endpoints');
  const flags = require('./endpoints/flags-endpoints');
  const broker = require('./endpoints/broker-endpoints');
  const i18n = require('./endpoints/i18n-endpoints');
  const statics = require('./utils/statics-utils');
  const csrfUtils = require('./utils/csrf-utils');
  const apiRouter = require('./routes/api-routes');
  const healthRouter = require('./routes/health-routes');
  const monitoringRouter = require('./routes/monitoring-routes');
  const offeringRouter = require('./routes/offering-routes');
  const proxyRoot = nconf.get('proxyRoot');

  // Very basic check to make sure user is logged in before serving response
  const verifyAuth = (req, res, next) => {
    if (!req.isAuthenticated() && !(req.headers && req.headers.authorization)) {
      res.sendStatus(401);
      return;
    }
    auth.session(req, res);
    next();
  };

  const verifyDevOpsFeatureFlag = (req, res, next) => {
    verifyFeatureFlag('coligo-ui-devops', req, res, next);
  };

  // inject helmet and apply various security best practices
  app.use(helmet());

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(useragent.express());

  // Save the currently selected BSS and IMS account ids in the user session so we can use them for
  // feature flagging.
  app.use((req, res, next) => {
    const user = req.session && req.session.passport && req.session.passport.user;
    if (user) {
      if (req.headers['x-auth-account-id']) { user.bss_account = req.headers['x-auth-account-id']; }
      if (req.headers['x-auth-ims-account-id']) { user.ims_account = req.headers['x-auth-ims-account-id']; }
    }
    next();
  });

  app.get([
    `${contextRoot}cli`,
    `${contextRoot}create/project*`,
    `${contextRoot}create/component*`,
    `${contextRoot}create/config*`,
    `${contextRoot}jobs`,
    `${contextRoot}landing`,
    `${contextRoot}overview`,
    `${contextRoot}projects`,
    `${contextRoot}project/*`,
    `${contextRoot}health*`,
    `${contextRoot}offering*`,
  ], checkAuthRoute, clearSessionCookieIfExpired, verifyAuth, csrfUtils.createCsrfToken(), viewUtils.basicView);

  // For dev / test purposes use this endpoint to get your auth info
  app.get(`${contextRoot}api/authinfo`, verifyAuth, (req, res) => {
    res.send(`<textarea style="width:100%;height:100%;">${JSON.stringify(req.session.passport.user, null, 2)}</textarea>`);
  });

  // Redirect from the context root to the landing page
  app.get(contextRoot, (req, res) => {
    res.redirect(301, `${proxyRoot}landing`);
  });

  // Feature flags
  app.get(`${contextRoot}api/flags`, verifyAuth, flags.getFlag);

  app.get(`${contextRoot}statics`, (req, res) => res.json(statics.getColigoStatics()));
  app.get(`${contextRoot}files`, (req, res) => res.json(statics.getConsoleStatics()));

  // Serve language bundles so we can fetch them external when needed
  app.get(`${contextRoot}locale`, i18n.loadBundle);

  // Readiness and liveness probes for kubernetes needed for the console
  app.get('/readiness', (req, res) => {
    /* Readiness -> return 200 if uService is able to accept request
        else return 503 if uService is currently unable to process requests  */
    res.status(200).send();
  });
  app.get('/liveness', (req, res) => {
    /* Liveness -> return 200 for normal status else return 503
        if uService needs to be restarted */
    res.status(200).send();
  });

  // Setup /api routes
  app.use(`${contextRoot}api/core`, verifyAuth, apiRouter);

  // Setup /health routes
  app.use(`${contextRoot}api/health`, verifyAuth, verifyDevOpsFeatureFlag, healthRouter);

  // Setup the monitoring / alerting routes
  app.use(`${contextRoot}api/monitoring`, monitoringRouter);

  // Setup the offering routes
  app.use(`${contextRoot}api/offering`, verifyAuth, offeringRouter);

  // provide both, a ui view and simple json response for general UI availability
  app.get(`${contextRoot}availability/view`, viewUtils.basicView);
  app.get(`${contextRoot}availability/status`, (req, res) => {
    res.status(200).json({ status: 'OK - Coligo UI is up and running!' });
  });
};

// Set up Express appropriately for a console microservice
const setupOptions = {
  baseDir: __dirname,
  bodyParserOptions: {
    // We need to verify the JSON body of requests and return a 400 if the body is not valid JSON
    // otherwise it will throw a 500 error and trigger alerts. The only time the JSON body should
    // be invalid is when the server api is being called directly with invalid input, which is not
    // a scenario we support.
    verify: (req, res, buf, encoding) => {
      let jsonString = '';
      try {
        jsonString = buf.toString(encoding);
        if (!jsonString) { return; }
        JSON.parse(jsonString);
      } catch (err) {
        logger.error('>>>', req.method, req.originalUrl, '<<< 400 |', err.toString(), '|', jsonString);
        res.sendStatus(400);
        throw err;
      }
    },
  },
  configRoutesFn: configRoutes,
  i18nOptions: {
    appendNamespaceToMissingKey: false,
    backend: null,
    keySeparator: false,
    nsSeparator: false,
    resources: languageBundles,
  },
  serveStaticOptions: {
    setHeaders: (res /* , path, stat */) => {
      // see https://www.npmjs.com/package/serve-static
      // Use aggressive caching since our static files are versioned
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    },
    staticFileDir: __dirname + '/public',
  },
};

const app = express();

// load the config
import * as nconf from '@console/console-platform-nconf';
nconf.env();
if (app.get('env') === 'development') {
  nconf.file('development', `${__dirname}/config/app-development.json`);
}
nconf.file(`${__dirname}/config/app.json`);

import * as bluemixMonitorResponseTime from '@console/console-platform-monitor-response-time';
// tslint:disable-next-line:no-var-requires
require('@console/console-platform-monitor-outgoing-response-time'); // No additional code reference needed

// Install the middleware
bluemixMonitorResponseTime.useResponseTime(app);

// Make sure the bss_account query parameter is set so that the express-session
// handles updating the IAM token for us.
app.use((req, res, next) => {
  const account = (req.query && (req.query.bss_account || req.query.accountId)) || (req.headers && req.headers['x-auth-account-id']);
  if (account === 'undefined' || account === 'null' || account === '') {
    logger.error('>>>', req.method, req.originalUrl, '<<< 400 | Invalid bss_account');
    res.sendStatus(400);
  } else {
    if (account) { req.query.bss_account = account; }
    next();
  }
});

// Do some general query parameter validation. No arrays or null bytes.
app.use((req, res, next) => {
  const params = Object.keys(req.query || {});
  if (params.some((k) => Array.isArray(req.query[k]) || req.query[k] === '\u0000')) {
    logger.error('>>>', req.method, req.originalUrl, '<<< 400 | Invalid query parameter');
    res.sendStatus(400);
  } else { next(); }
});

/**
 *  Redirect all calls to the legacy /knative route to the new /codeengine context root
 */
function doRedirect(req, res) {
  const urlParts = req.originalUrl.split('/knative');
  const targetPath = (urlParts && urlParts[1]) || '';
  let codeengineUrl = `/codeengine/${targetPath}`;
  if (codeengineUrl.indexOf('//') > -1) {
    codeengineUrl = codeengineUrl.replace('\/\/', '\/');
  }
  logger.info(`Redirecting incoming request against ${req.originalUrl} to ${codeengineUrl}`);
  res.redirect(301, codeengineUrl);
}
app.all('/knative*', doRedirect);

expressSetup.setup(app, setupOptions);
