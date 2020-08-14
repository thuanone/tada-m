
import * as resiliency from '@console/console-platform-resiliency';

import * as commonErrors from '../../../common/Errors';
import * as commonModel from '../../../common/model/common-model';
import * as k8sModel from '../model/k8s-model';
import * as monitoringModel from '../model/monitoring-model';
import * as monitorUtils from './monitoring-utils';

import * as loggerUtil from './logger-utils';
const logger = loggerUtil.getLogger('clg-ui:utils:http');

/**
 * This helper function checks whether a HTTP response indicates an error
 *
 * @param {} error
 * @param {HTTPResponse} response
 */
export function isHttpResponseOk(error, response) {
  return (!error &&
    response &&
    response.statusCode &&
    ((response.statusCode >= 200) && (response.statusCode < 400)));
}

/**
 * This helper function enhances the error object with the HTTPResponse.statusCode (if exists)
 *
 * @param {*} error
 * @param {*} response
 */
export function getEnhancedErrorObj(error, response) {
  if (!error) {
    error = {};
  }
  if (error && !error.status && response && response.statusCode) {
    error.status = response.statusCode;
  }

  return error;
}

export function getK8EnhancedErrorObj(ctx: commonModel.IUIRequestContext, error, response, body): k8sModel.IKubernetesAPIError {
  const fn = 'getK8EnhancedErrorObj ';
  if (!error && response) {
    error = {};

    // check if there is an error message
    let errorJson;
    try {
      if (body) {
        errorJson = JSON.parse(JSON.stringify(body));
      }
    } catch (parseErr) {
      logger.warn(ctx, `${fn}- Failed to parse response content: '${body}' - error: ${parseErr.message}`);
    }

    if (errorJson) {
      error.message = errorJson.message;
      error.reason = errorJson.reason;
      error.details = errorJson.details;
      error.status = errorJson.code;
    } else if (response.statusCode) {
      error.status = response.statusCode;
    }
  } else if (error && !error.status) {
    error.status = response && response.statusCode;
  }
  return error;
}

export function getCommonHeaders(ctx: commonModel.IUIRequestContext, accessToken?: string): { [key: string]: string } {
  const transactionId = ctx && ctx.tid;
  const requestId = `coligo-ui-${Date.now()}`;
  const headers = {
    'Request-Id': requestId,
    'Transaction-Id': transactionId,
    'X-Global-Transaction-Id': transactionId,
    'X-Request-Id': requestId,
    'X-Transaction-Id': transactionId,
  } as { [key: string]: string };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

/**
 * This method parses the given data param into as JSON and returns the object, if the input is of type string.
 * If the given data object is not of type string, it will be returned without applying any modifications to it.
 * In case the parser fails, this method returns "undefined"
 * @param {*} ctx - the IUIRequestContext
 * @param {any} data - the data object that should be parsed
 */
export function safeJSONParse(ctx: commonModel.IUIRequestContext, data: any) {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (parseErr) {
    logger.warn(ctx, `safeJSONParse - Failed to parse response content: '${data}' - error: ${parseErr.message}`);
    return undefined;
  }
}

export function sendRequest(ctx: commonModel.IUIRequestContext, monitorName: string, options: {[key: string]: any}): Promise<any> {
  const fn = 'sendRequest ';
  logger.debug(ctx, `${fn}> monitorName: '${monitorName}'`);

  // prepare performance monitoring
  const startTime = Date.now();
  const monitor: monitoringModel.IPerformanceMonitor = {
    kind: 'backend',
    name: monitorName,
  };

  return new Promise<any>((resolve, reject) => {

    resiliency.request(options, (error, response, body) => {
      const duration = Date.now() - startTime;

      try {
        // check whether the request was successful
        const isSuccessful: boolean = isHttpResponseOk(error, response);

        // log the backend call
        monitorUtils.createPerfLogEntry(ctx, monitor, duration, isSuccessful, false);

        // create a performance monitoring entry
        monitorUtils.storePerfMonitorEntry(monitor, duration);

        // in an error situation we would like to get more insights
        if (!isSuccessful) {
          // set the HTTP status code into the error
          error = getEnhancedErrorObj(error, response);

          const statusCode: number = response ? response.statusCode : -1;
          logger.warn(ctx, `${fn}- Error while sending request '${monitorName}' - rc: ${statusCode}, responseBody: '${body && JSON.stringify(body)}', error: '${JSON.stringify(error)}'`);
          logger.debug(ctx, `${fn}< ERROR`);
          return reject(new commonErrors.BackendApiError(body, error));
        }

        // convert the response body to a JSON object
        const responseData = safeJSONParse(ctx, body);
        if (!responseData) {
          const errMessage = `Failed to convert response.body to JSON - URL: ${options.urls}${options.path} - Status: ${response && response.statusCode}`;
          logger.error(ctx, errMessage);
          logger.debug(ctx, `${fn}< ERROR - failed to convert response.body to JSON`);
          return reject(new Error(errMessage));
        }

        logger.debug(ctx, `${fn}<`);
        resolve(responseData);
      } catch (err) {
        logger.error(ctx, `${fn}- Error while sending request '${monitorName}' - URL: ${options.urls}${options.path}- error: ${commonErrors.stringify(err)}`);
        logger.debug(ctx, `${fn}< ERROR - message: ${err.message}`);
        reject(err);
      }
    });
  });
}
