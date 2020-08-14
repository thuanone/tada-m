/**
 * IBM Confidential
 * Licensed Materials - Property of IBM
 * IBM Cloud Container Service, 5737-D43
 * (C) Copyright IBM Corp. 2017, 2019 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

import loggerUtil = require('@console/console-platform-log4js-utils');
import nconf = require('@console/console-platform-nconf');
import request = require('../utils/request-utils');
import utils = require('../utils/routes-utils');
const logger = loggerUtil.getLogger('clg-ui');

const getIamCookieName = (req, res, callback) => {
  const user = req.session && req.session.passport && req.session.passport.user;
  if (user && user.iamCookieName) { callback(user.iamCookieName); } else {
    const options = {
      headers: utils.getCommonHeaders(req),
      json: true,
      method: 'GET',
      timeout: 60000,
      url: `${nconf.get('iamGlobalUrl')}/v1/info`,
    };
    request(options, (error, response, body) => {
      const status = response && response.statusCode || 500;
      if (!error && status === 200 && body && body.iamCookieName) {
        // Save the cookie name in the user session so we don't have to look it up again
        if (user) { user.iamCookieName = body.iamCookieName; }
        callback(body.iamCookieName);
      } else {
        utils.logRequest(req, options, status, error, body);
        res.sendStatus(status);
      }
    });
  }
};

const getIamCookie = (req, res, callback) => {
  getIamCookieName(req, res, (cookieName) => {
    let cookie = req.cookies[cookieName];
    // Fall back to the old bluemix.net cookie name for now, in case we didn't find the one we wanted
    // istanbul ignore next
    if (!cookie) {
      if (process.env.CONSOLE_ENV === 'prod') { cookie = req.cookies['com.ibm.cloud.iam.token.yp']; } else { cookie = req.cookies['com.ibm.cloud.iam.token.ys1']; }
    }
    callback(cookie);
  });
};

// This came from the console core team. We need to pass the IP to IAM.
// istanbul ignore next
const getClientIP = (req) => {
  let ip = (req.headers['true-client-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress);
  if (ip === '::1') { return ip; }
  if (ip && ip.indexOf(']:') !== -1) {
    ip = ip.substring(1, ip.indexOf(']:'));
  } else if (ip && ip.indexOf(':') !== -1) {
    ip = ip.substring(0, ip.indexOf(':'));
  }
  if (ip && ip.indexOf(',') !== -1) {
    ip = ip.substring(0, ip.indexOf(','));
  }
  return ip;
};

const iamTokenRequest = (form, auth, req, res, callback) => {
  const options = {
    auth: auth || {
      pass: 'bx',
      user: 'bx',
    },
    form,
    headers: utils.getCommonHeaders(req),
    json: true,
    method: 'POST',
    timeout: 60000,
    url: `${nconf.get('iamGlobalUrl')}/identity/token`,
  };
  request(options, (error, response, body) => {
    const status = response && response.statusCode || 500;
    if (!error && status === 200 && body) {
      callback(body);
    } else {
      // Handle certain 400 responses from IAM:
      // "errorCode": "BXNIM0421E", "errorMessage": "Provided cookie is expired"
      // "errorCode": "BXNIM0109E", "errorMessage": "Property missing or empty"
      // "errorCode": "BXNIM0139E", "errorMessage": "Wrong client id passed to retrieve tokens for a IAM cookie"
      // "errorCode": "BXNIM0141E", "errorMessage": "User is not member of the specified account"
      const requestId = body && body.context && body.context.requestId;
      const errorCode = body && body.errorCode;
      const data = { requestId, errorCode, description: req.t('Authorization failed.') };
      // If the cookie is expired then return the error code so we know to get a new cookie
      if (errorCode === 'BXNIM0421E') {
        utils.logRequest(req, options, status, error, body);
        logger.info('>>>', options.method, options.url, '<<<', status, 'IAM cookie expired, generating a new one');
        callback(data);
      } else {
        // If there's nothing a user can really do to recover then make sure they get logged out
        if (errorCode && ['BXNIM0109E', 'BXNIM0139E'].indexOf(errorCode) > -1) {
          logger.info('>>>', options.method, options.url, '<<<', status, 'IAM request failed due to missing property or wrong client ID. User must reauthenticate.');
        } else {
          utils.logRequest(req, options, status, error, body);
          if (errorCode === 'BXNIM0141E') {
            data.description = req.t('The current user is not a member of the selected account. Choose another account or ask the account owner to add you to the account.');
          }
        }
        res.status(status).json(data);
      }
    }
  });
};

// Exchange an IAM cookie for auth tokens
const exchangeIamCookieForTokens = (cookie, req, res, callback) => {
  const form = {
    bss_account: res.locals.auth.account,
    cookie,
    grant_type: 'urn:ibm:params:oauth:grant-type:iam-cookie',
  };
  iamTokenRequest(form, null, req, res, callback);
};

// Refresh the IAM auth tokens
const refreshIamToken = (refreshToken, req, res, callback) => {
  const form = {
    bss_account: res.locals.auth.account,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  };
  iamTokenRequest(form, null, req, res, callback);
};

// Exchange the IAM cookie for a new cookie signed by the "bx" client id
const getBxClientIamCookie = (cookie, req, res, callback) => {
  const auth = {
    pass: process.env.iamClientSecret,
    user: process.env.iamClientId,
  };
  const form = {
    bss_account: res.locals.auth.account,
    cookie,
    grant_type: 'urn:ibm:params:oauth:grant-type:iam-cookie',
    ip_address: getClientIP(req),
    receiver_client_ids: 'bx',
    response_type: 'iam_cookie',
  };
  iamTokenRequest(form, auth, req, res, callback);
};

// Get a new iam cookie based on a session refresh token. We need this for the cases
// where the IAM cookie isn't set for some reason or for when it's expired.
const getNewIamCookie = (refreshToken, req, res, callback) => {
  const auth = {
    pass: process.env.iamClientSecret,
    user: process.env.iamClientId,
  };
  const form = {
    bss_account: res.locals.auth.account,
    grant_type: 'refresh_token',
    ip_address: getClientIP(req),
    receiver_client_ids: process.env.iamClientId,
    refresh_token: refreshToken,
    response_type: 'iam_cookie',
  };
  return iamTokenRequest(form, auth, req, res, callback);
};

const sessionAuth = (req, res) => {
  res.locals.auth = {
    account: req.query.bss_account,
    iamToken: req.user ? req.user.iam_token : req.headers && req.headers.iam_token,
    metro: (req.query && req.query.metro) || (req.headers && req.headers['x-auth-metro']) || '',
    refreshToken: req.user ? req.user.refreshToken : '',
    region: ((req.query && (req.query.region || req.query.env_id || req.query['q.env_id'])) || (req.headers && req.headers['x-auth-region']) || '').split(':').pop(),
    resourceGroup: (req.query && req.query.resourceGroup) || (req.headers && req.headers['x-auth-resource-group']) || undefined,
  };

  // FIXME: Right now the armada-api checks permissions on the resource group whenever we include
  // it on the request. But for viewing clusters the user doesn't actually need to have access to
  // the resource group for that cluster, as long as they have permissions on the cluster. So until
  // the api gets updated we will remove the RG from all GET requests for a cluster or its resources.
  // istanbul ignore next
  if (req.method === 'GET' && /^\/(ui|kubernetes)\/api\/clusters\/[a-zA-Z0-9-]{1,64}/.test(req.url)) {
    delete res.locals.auth.resourceGroup;
  }
};

const hasBxClientAuth = (user) => user
  && user.bxClientAuth
  && user.bxClientAuth.access_token
  && user.bxClientAuth.refresh_token
  && user.bxClientAuth.expiration;

// Token is considered expired if it's already expired or going to expire in the next 5 minutes
const tokenExpired = (expiration) => expiration < (Math.floor((new Date()).getTime() / 1000) + (60 * 5));

// Certain armada-api requests require that we use auth tokens that have been signed
// by the "bx" client ID. These are requests that need to hit certain APIs in softlayer.
// Once we get these tokens we cache them in the user session and refresh them as needed.
const bxAuth = (req, res, next) => {
  const user = req.session && req.session.passport && req.session.passport.user;
  const updateAuth = (auth) => {
    if (user) {
      user.bxClientAuth = Object.assign(auth, {
        bss_account: res.locals.auth.account,
      });
    }
    Object.assign(res.locals.auth, {
      iamToken: auth.access_token,
      refreshToken: auth.refresh_token,
    });
    next();
  };

  // We already have cached bx auth tokens
  if (hasBxClientAuth(user)) {
    // The tokens are expired or about to expire, or the account has changed, so refresh them
    if (tokenExpired(user.bxClientAuth.expiration) || user.bxClientAuth.bss_account !== res.locals.auth.account) {
      refreshIamToken(user.bxClientAuth.refresh_token, req, res, updateAuth);
    } else {
      // Cached tokens are good so just use them
      Object.assign(res.locals.auth, {
        iamToken: user.bxClientAuth.access_token,
        refreshToken: user.bxClientAuth.refresh_token,
      });
      next();
    }
  } else {
    // Get new bx auth tokens
    const getNewCookie = () => {
      // Get a new IAM cookie since it's either not set or is expired
      getNewIamCookie(res.locals.auth.refreshToken, req, res, (auth) => {
        getBxClientIamCookie(auth.iam_cookie, req, res, (bxClientAuth) => {
          exchangeIamCookieForTokens(bxClientAuth.iam_cookie, req, res, updateAuth);
        });
      });
    };
    getIamCookie(req, res, (cookie) => {
      if (cookie) {
        // Use existing IAM cookie
        getBxClientIamCookie(cookie, req, res, (resp) => {
          // If the cookie is expired get a new one
          if (resp.errorCode === 'BXNIM0421E') { getNewCookie(); } else { exchangeIamCookieForTokens(resp.iam_cookie, req, res, updateAuth); }
        });
      } else { getNewCookie(); }
    });
  }
};

module.exports = {
  bx: bxAuth,
  session: sessionAuth,
};
