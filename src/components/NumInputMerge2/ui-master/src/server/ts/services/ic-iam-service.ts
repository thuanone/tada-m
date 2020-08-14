const COMP_NAME = 'iam';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:service:${COMP_NAME}`);

import * as commonErrors from '../../../common/Errors';
import * as commonModel from '../../../common/model/common-model';
import * as iamModel from '../model/iam-model';
import * as monitoringModel from '../model/monitoring-model';
import * as httpUtils from '../utils/http-utils';
import * as monitorUtils from '../utils/monitoring-utils';

import * as nconf from 'nconf';

const STATIC_IAM_TOKENS = {
  access_token: process.env.WORKAROUND_IAM_ACCESS_TOKEN || undefined,
  bss_account: process.env.WORKAROUND_IAM_ACCOUNT_GUID || undefined,
  refresh_token: process.env.WORKAROUND_IAM_REFRESH_TOKEN || undefined,
};

// FIXME -> Workaround!!! for local development we need to point to PROD
const IS_LOCAL_WORKAROUND = (STATIC_IAM_TOKENS.access_token !== undefined && STATIC_IAM_TOKENS.refresh_token !== undefined);
if (IS_LOCAL_WORKAROUND) {
  logger.error(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!IS_LOCAL_WORKAROUND=${IS_LOCAL_WORKAROUND}, ${JSON.stringify(STATIC_IAM_TOKENS)}`);
}

function getStaticAccessTokens() {
  return {
    access_token: process.env.WORKAROUND_IAM_ACCESS_TOKEN || undefined,
    bss_account: process.env.WORKAROUND_IAM_ACCOUNT_GUID || undefined,
    refresh_token: process.env.WORKAROUND_IAM_REFRESH_TOKEN || undefined
  };
}

function isLocalWorkaround() {
  const staticTokens = getStaticAccessTokens();
  return (staticTokens.access_token !== undefined && staticTokens.refresh_token !== undefined);
}

// The functions clientId and its secret are stored in a ACE vault. Additionally, the values are populated as environment variables
const functionsClientIdAuthHeader = `${process.env.functionsiamClientId}:${process.env.functionsiamClientSecret}`;
const functionsClientIdAuthHeaderEncoded = `${Buffer.from(functionsClientIdAuthHeader).toString('base64')}`;

const iamClientId = process.env.iamClientId;
const iamClientIdAuthHeader = `${iamClientId}:${process.env.iamClientSecret}`;
const iamClientIdAuthHeaderEncoded = `${Buffer.from(iamClientIdAuthHeader).toString('base64')}`;

const IAM_CLIENT_AUTHORIZATIONS = {
  bx: 'Yng6Yng=',
  functions: functionsClientIdAuthHeaderEncoded,
  iamClientId: iamClientIdAuthHeaderEncoded,
  kube: 'a3ViZTprdWJl',
};

const iamGlobalUrl = IS_LOCAL_WORKAROUND ? 'https://iam.cloud.ibm.com' : (nconf.get('iamGlobalUrl') || process.env.iamGlobalUrl || 'https://iam.cloud.ibm.com');

function getRequestHeaders(ctx: commonModel.IUIRequestContext, iamSpecificHeaders): { [key: string]: string } {

  // retrieve a set of common headers from a utils functions
  let headers = Object.assign({}, httpUtils.getCommonHeaders(ctx));

  // add iam service specific headers
  headers = Object.assign(headers, iamSpecificHeaders);

  return headers;
}

export function getIAMRefreshToken(req) {
  if (isLocalWorkaround()) {
    return getStaticAccessTokens().refresh_token;
  }
  return req && req.user && req.user.refreshToken || '';
}

export function getIAMAccessToken(req) {
  if (isLocalWorkaround()) {
    return getStaticAccessTokens().access_token;
  }
  return req && req.user && req.user.iam_token || '';
}

export function getAccountId(req) {
  if (isLocalWorkaround()) {
    return getStaticAccessTokens().bss_account;
  }
  return req && req.user && req.user.bss_account || '';
}

export function getServiceStatus(ctx: commonModel.IUIRequestContext): Promise<commonModel.IUIServiceStatus> {
  const fn = 'getServiceStatus ';
  logger.debug(ctx, `${fn}>`);

  const monitorName = `${COMP_NAME}::getServiceStatus`;

  const iamStatus: commonModel.IUIServiceStatus = {
    id: 'iam',
    status: 'ERROR',
  };

  // retrieve the IAM token
  const accessToken = getIAMAccessToken(ctx);
  const options = {
    cachePolicy: 'NO_CACHE',
    headers: getRequestHeaders(ctx, {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    }),
    method: 'GET',
    path: '/identitystatus',
    urls: iamGlobalUrl,
  };

  // send the HTTP request
  return httpUtils.sendRequest(ctx, monitorName, options)
    .then((responseData) => {
      // set the status
      iamStatus.status = responseData ? 'OK' : 'FAILED';
      logger.debug(ctx, `${fn}< ${responseData}`);
      return iamStatus as commonModel.IUIServiceStatus;
    })
    .catch((err) => {
      const statusCode: number = err ? err.status : -1;
      logger.warn(ctx, `${fn}- Error accessing the IAM service - error: ${commonErrors.stringify(err)}`);

      logger.debug(ctx, `${fn}< ${iamStatus.status}`);
      return iamStatus;
    });
}

/**
 * Retrieves a delegation refresh token for a specific service, that shall be used to retrieve IAM tokens for that same service.
 * @param {IUIRequestContext} ctx - contains context information
 * @param {String} refreshToken - the users refresh token
 * @param {String} receiverClientId - the client id (e.g. kube)
 * @param {String} encodedAuthValue - equals the URL-encoded authorization for of the client id (username:password) (e.g. 'functions:<functions_client-id-pw>' -> 'XXXXXXXXX').
 */
export function retrieveIAMDelegatedRefreshToken(ctx: commonModel.IUIRequestContext, refreshToken, receiverClientId, encodedAuthValue) {
  const fn = 'retrieveIAMDelegatedRefreshToken ';
  logger.debug(ctx, `${fn}>`);

  // input check
  if (!refreshToken || !receiverClientId || !encodedAuthValue) {
    const errorMsg = 'refreshToken, receiverClientId and encodedAuthValue must be set properly';
    logger.debug(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  // prepare performance monitoring
  const monitorName = `${COMP_NAME}::retrieveIAMDelegatedRefreshToken`;

  const options = {
    cachePolicy: 'NO_CACHE',
    headers: getRequestHeaders(ctx, {
      'Authorization': `Basic ${encodedAuthValue}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'cache-control': 'max-age=0, no-cache, no-store',
    }),
    method: 'POST',
    path: '/identity/token',
    qs: {
      delegated_refresh_token_expiry: 3600,
      grant_type: 'refresh_token',
      receiver_client_ids: receiverClientId,
      refresh_token: refreshToken,
      response_type: 'delegated_refresh_token',
    },
    timeoutThreshold: 70000,
    urls: iamGlobalUrl,
  };

  // send the HTTP request
  return httpUtils.sendRequest(ctx, monitorName, options)
    .then((responseData) => {
      if (!responseData || !responseData.delegated_refresh_token) {
        logger.debug(ctx, `${fn}< THROW ERROR - responseDate is undefined or does not contain the property delegated_refresh_token`);
        throw new commonErrors.FailedToGetDelegatedRefreshTokenError();
      }
      logger.debug(ctx, `${fn}< delegated refresh token`);
      return responseData.delegated_refresh_token;
    })
    .catch((err) => {
      logger.debug(ctx, `${fn}< THROW ERROR`);
      throw new commonErrors.FailedToGetDelegatedRefreshTokenError(err);
    });
}

/**
 * Retrieve an IBM Cloud IAM ID, IAM access, and IAM refresh token by using the delegated refresh token.
 * @param {IUIRequestContext} ctx - contains context information
 * @param {String} delegatedRefreshToken - the delegated refresh token of a specific receiver client_id (e.g. 'kube')
 * @param {String} encodedAuthValue - equals the URL-encoded authorization for the client id (username:password) (e.g. 'kube:kube' -> 'a3ViZTpidWJl').
 */
export function retrieveIAMTokens(ctx: commonModel.IUIRequestContext, delegatedRefreshToken: string, encodedAuthValue: string): Promise<iamModel.IIamTokens> {
  const fn = 'retrieveIAMTokens ';
  logger.debug(ctx, `${fn}>`);

  // input check
  if (!delegatedRefreshToken || !encodedAuthValue) {
    const errorMsg = 'delegatedRefreshToken and encodedAuthValue must be set properly';
    logger.debug(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  // prepare performance monitoring
  const monitorName = `${COMP_NAME}::retrieveIAMTokens`;

  const options = {
    cachePolicy: 'NO_CACHE',
    headers: getRequestHeaders(ctx, {
      'Authorization': `Basic ${encodedAuthValue}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'cache-control': 'max-age=0, no-cache, no-store',
    }),
    method: 'POST',
    path: '/identity/token',
    qs: {
      grant_type: 'urn:ibm:params:oauth:grant-type:delegated-refresh-token',
      refresh_token: delegatedRefreshToken,
    },
    timeoutThreshold: 70000,
    urls: iamGlobalUrl,
  };

  // send the HTTP request
  return httpUtils.sendRequest(ctx, monitorName, options)
    .then((responseData) => {
      logger.debug(ctx, `${fn}< IAM tokens`);
      return responseData as iamModel.IIamTokens;
    })
    .catch((err) => {
      logger.debug(ctx, `${fn}< THROW ERROR`);
      throw new commonErrors.FailedToGetIAMTokensError(err);
    });
}

/**
 * See: // See: https://cloud.ibm.com/apidocs/iam-identity-token-api#create-an-iam-access-token-and-delegated-refresh-t
 * @param {IUIRequestContext} ctx - contains context information
 * @param {String} apiKey - the api key that should be used to create new IAM tokens from
 * @param {String[] | String} receiverClientId - A comma separated list of one or more client IDs that will be able to consume the delegated refresh token
 */
export function retrieveIAMAccessTokenForApiKey(ctx: commonModel.IUIRequestContext, apiKey: string, iamBaseUrl?: string, receiverClientId?: string): Promise<iamModel.IIamTokens> {
  const fn = 'retrieveIAMAccessTokenForApiKey ';
  logger.debug(ctx, `${fn}>`);

  // input check
  if (!apiKey) {
    const errorMsg = 'apiKey must be set properly';
    logger.debug(ctx, `${fn}< REJECT '${errorMsg}'`);
    return Promise.reject(new Error(errorMsg));
  }

  // set the global IAM url
  let iamUrlToUse = iamBaseUrl;
  if (!iamBaseUrl) {
    iamUrlToUse = iamGlobalUrl;
  }

  const options = {
    cachePolicy: 'NO_CACHE',
    headers: getRequestHeaders(ctx, {
      'Content-Type': 'application/x-www-form-urlencoded',
      'cache-control': 'max-age=0, no-cache, no-store',
    }),
    method: 'POST',
    path: '/identity/token',
    qs: {
      apikey: apiKey,
      delegated_refresh_token_expiry: 300,
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      receiver_client_ids: receiverClientId || 'bx',
      response_type: 'cloud_iam delegated_refresh_token',
    },
    timeoutThreshold: 10000,
    urls: iamUrlToUse,
  };

  const monitorName = `${COMP_NAME}::retrieveIAMAccessTokenForApiKey`;

  // send the HTTP request
  return httpUtils.sendRequest(ctx, monitorName, options)
    .then((responseData) => {
      logger.debug(ctx, `${fn}< ${responseData}`);
      return responseData as iamModel.IIamTokens;
    })
    .catch((err) => {
      logger.debug(ctx, `${fn}< THROW ERROR`);
      throw new commonErrors.FailedToGetIAMTokensForAPIKeyError(err);
    });
}

/**
 * See: // See: https://cloud.ibm.com/apidocs/iam-identity-token-api#get-details-of-an-api-key-by-its-value
 * @param {IUIRequestContext} ctx - contains context information
 * @param {String} apiKey - the api key that should be used to create new IAM tokens from
 * @param {String} accessToken - the authorization token used for this request
 */
export function getDetailsOfApiKey(ctx: commonModel.IUIRequestContext, apiKey: string, iamBaseUrl?: string, accessToken?: string): Promise<iamModel.IApiKeyDetails> {
  const fn = 'getDetailsOfApiKey ';
  logger.debug(ctx, `${fn}>`);

  // set the global IAM url
  let iamUrlToUse = iamBaseUrl;
  if (!iamBaseUrl) {
    iamUrlToUse = iamGlobalUrl;
  }

  const options = {
    cachePolicy: 'NO_CACHE',
    headers: getRequestHeaders(ctx, {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'IAM-ApiKey': apiKey,
      'cache-control': 'max-age=0, no-cache, no-store',
    }),
    method: 'GET',
    path: '/v1/apikeys/details',
    timeoutThreshold: 10000,
    urls: iamUrlToUse,
  };

  const monitorName = `${COMP_NAME}::getDetailsOfApiKey`;

  // send the HTTP request
  return httpUtils.sendRequest(ctx, monitorName, options)
    .then((responseData) => {
      logger.debug(ctx, `${fn}< ${responseData}`);
      return responseData as iamModel.IApiKeyDetails;
    })
    .catch((err) => {
      logger.debug(ctx, `${fn}< THROW ERROR`);
      throw new commonErrors.FailedToGetDetailsOfAPIKeyError(err);
    });
}

export async function getBxIAMTokens(ctx: commonModel.IUIRequestContext) {
  const fn = 'getBxIAMTokens ';
  logger.debug(ctx, `${fn}>`);

  const tokens = {
    access_token: 'NOT_SET',
    refresh_token: 'NOT_SET',
  };

  // FIXME - Remove that before it gets deployed to production
  if (isLocalWorkaround()) {
    logger.error(ctx, `${fn}- USING static IAM tokens`);
    tokens.refresh_token = getStaticAccessTokens().refresh_token;
    tokens.access_token = getStaticAccessTokens().access_token;
    logger.debug(ctx, `${fn}<`);
    return tokens;
  }

  // prepare performance monitoring
  const startTime = Date.now();
  const monitor: monitoringModel.IPerformanceMonitor = {
    kind: 'backend',
    name: `${COMP_NAME}::getBxIAMTokens`,
  };

  try {
    // the user refresh token is used to retrieve the delegated request token
    const userRefreshToken = getIAMRefreshToken(ctx);

    const bxDelegatedRefreshToken: any = await retrieveIAMDelegatedRefreshToken(ctx, userRefreshToken, 'bx', IAM_CLIENT_AUTHORIZATIONS.iamClientId);

    const bxIamTokens = await retrieveIAMTokens(ctx, bxDelegatedRefreshToken, IAM_CLIENT_AUTHORIZATIONS.bx);

    // tslint:disable-next-line:no-string-literal
    tokens.refresh_token = bxIamTokens['refresh_token'];
    // tslint:disable-next-line:no-string-literal
    tokens.access_token = bxIamTokens['access_token'];

    const duration = Date.now() - startTime;
    monitorUtils.createPerfLogEntry(ctx, monitor, duration, true, false);

    // create a performance monitoring entry
    monitorUtils.storePerfMonitorEntry(monitor, duration);
  } catch (e) {
    const duration = Date.now() - startTime;

    monitorUtils.createPerfLogEntry(ctx, monitor, duration, false, false);

    // create a performance monitoring entry
    monitorUtils.storePerfMonitorEntry(monitor, duration);

    logger.error(ctx, `${fn}- Failed to retrieve a bx delegation token to access kube services - error: ${commonErrors.stringify(e)}`);
    return null;
  }

  logger.debug(ctx, `${fn}<`);
  return tokens;
}
