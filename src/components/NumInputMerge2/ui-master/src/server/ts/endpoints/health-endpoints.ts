import { Message } from '@console/pal/Components';
import * as nconf from 'nconf';

import * as commonErrors from '../../../common/Errors';
import * as commonModel from '../../../common/model/common-model';
import * as healthMiddleware from '../middleware/health-middleware';
import * as projectModel from '../model/project-resource-model';
import * as coligoService from '../services/coligo-service';
import * as iamService from '../services/ic-iam-service';
import * as launchdarklyService from '../services/launchdarkly-service';
import * as resourceControllerService from '../services/resource-controller-service';
import * as cacheUtils from '../utils/cache-utils';
import * as coligoUtils from '../utils/coligo-utils';
import * as middlewareUtils from '../utils/middleware-utils';
import * as monitoringUtils from '../utils/monitoring-utils';
import { getClgContext, getClgMonitor } from '../utils/request-context-utils';

const COMPONENT = 'health';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:endpoints:${COMPONENT}`);

export function getPerformanceMonitors(req, res): void {
    const fn = 'getPerformanceMonitors ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    monitoringUtils.getPerfMonitors(ctx)
        .then((monitors: monitoringUtils.IPerformanceMonitorEntry[]) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, monitors);
            logger.debug(ctx, `${fn}< 200 - ${monitors ? monitors.length : 'NULL'} monitors - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof commonErrors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve performance monitors`, err);
                error = new commonErrors.FailedToGetPerfMonitorsError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}

export function getCacheStats(req, res): void {
    const fn = 'getCacheStats ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    try {
        const stats = [];
        for (const cacheId of cacheUtils.getCaches()) {
            stats.push(cacheUtils.getCacheInstance(cacheId).getCacheStats());
        }
        const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, stats);
        logger.debug(ctx, `${fn}< 200 - ${stats ? stats.length : 'NULL'} cache statistics - duration: ${result.duration}ms`);
        res.status(200).send(result);
    } catch (err) {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
            logger.error(ctx, `${fn}- Failed to retrieve cache statistics`, err);
            error = new commonErrors.FailedToGetCacheStatsError(err);
        }

        const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
        logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
        res.status(result.statusCode).send(result);
    }
}

function triggerSimpleStatusChecks(req, ctx: commonModel.IUIRequestContext): Array<Promise<commonModel.IUIServiceStatus>> {

    const statusCheckProms: Array<Promise<commonModel.IUIServiceStatus>> = [];

    // check the status of the ACE cache
    statusCheckProms.push(healthMiddleware.getAceSessionStoreStatus(ctx));

    // check whether ACE header files can be served
    statusCheckProms.push(healthMiddleware.getAceHeaderFilesStatus(req, ctx));

    // check whether IAM service is available
    statusCheckProms.push(iamService.getServiceStatus(ctx));

    // check whether the resource controller is available
    statusCheckProms.push(resourceControllerService.getServiceStatus(ctx));

    // check whether LaunchDarkly is available
    statusCheckProms.push(launchdarklyService.getServiceStatus(ctx));

    // check whether all mandatory config items are set
    statusCheckProms.push(healthMiddleware.getAppConfigStatus(ctx));

    // check whether the Coligo API servers are available
    for (const coligoRegion of coligoUtils.getRegions()) {
        statusCheckProms.push(healthMiddleware.getColigoApiServerStatus(ctx, coligoRegion.id));
    }

    return statusCheckProms;
}

function checkWhetherTheAppIsAbleToObtainBxTokens(ctx: commonModel.IUIRequestContext): Promise<commonModel.IUIServiceStatus> {
    const checkName = 'iam_obtain-bx-tokens';
    return iamService.getBxIAMTokens(ctx)
        .then((tokens) => {
            const serviceStatus: commonModel.IUIServiceStatus = {
                id: checkName,
                status: (tokens && tokens.access_token) ? 'OK' : 'FAILED',
            };
            return serviceStatus;
        }).catch((err) => {
            const serviceStatus: commonModel.IUIServiceStatus = {
                details: err && err.message,
                id: checkName,
                status: 'ERROR',
            };
            return serviceStatus;
        });
}

function checkWhetherTheResourceControllerResponds(ctx: commonModel.IUIRequestContext): Promise<commonModel.IUIServiceStatus> {
    const checkName = 'resource-controller_list-resources';
    return resourceControllerService.getProjectResources(ctx, 'us-south')
        .then((projects: projectModel.IProjectResource[]) => {
            const serviceStatus: commonModel.IUIServiceStatus = {
                id: checkName,
                status: (projects) ? 'OK' : 'FAILED',
            };
            return serviceStatus;
        }).catch((err) => {
            const serviceStatus: commonModel.IUIServiceStatus = {
                details: err && err.message,
                id: checkName,
                status: 'ERROR',
            };
            return serviceStatus;
        });
}

function triggerHealthChecks(ctx: commonModel.IUIRequestContext): Array<Promise<commonModel.IUIServiceStatus>> {

    const healthCheckProms: Array<Promise<commonModel.IUIServiceStatus>> = [];

    // check whether IAM works properly
    healthCheckProms.push(checkWhetherTheAppIsAbleToObtainBxTokens(ctx));

    // check whether the resource controller works properly
    healthCheckProms.push(checkWhetherTheResourceControllerResponds(ctx));

    return healthCheckProms;
}

/**
 * The monitor status check is used to check the basic components.
 * It does not expose any secrets or insights on the infrastructure.
 * @param req
 * @param res
 */
export function getMonitoringStatus(req, res) {
    const fn = 'getMonitoringStatus ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    try {
        const status: any = {};

        status.time = new Date().toISOString();
        status.app = {
            name: 'Code Engine UI',
        };

        status.services = {};
        status.details = {};

        const monitorCheckProms: Array<Promise<commonModel.IUIServiceStatus>> = [];

        // trigger all simple status checks
        monitorCheckProms.push(...triggerSimpleStatusChecks(req, ctx));

        // wait for all services status
        Promise.all(monitorCheckProms.map((prom: Promise<commonModel.IUIServiceStatus>) => prom.catch((err: Error) => err)))
            .then((results: commonModel.IUIServiceStatus[]) => {
                for (const serviceStatus of results) {
                    status.services[serviceStatus.id] = serviceStatus.status;
                }

                // send the result
                const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, status);
                logger.debug(ctx, `${fn}< 200 - status - duration: ${result.duration}ms`);
                res.status(200).send(result);
            });
    } catch (err) {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
            logger.error(ctx, `${fn}- Failed to retrieve health status`, err);
            error = new commonErrors.FailedToGetHealthStatusError(err);
        }

        const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
        logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
        res.status(result.statusCode).send(result);
    }
}

export function getHealthStatus(req, res) {
    const fn = 'getHealthStatus ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    try {
        const status: any = {};

        status.time = new Date().toISOString();
        status.app = {
            name: 'Coligo UI',
        };

        status.services = {};
        status.details = {};

        const healthCheckProms: Array<Promise<commonModel.IUIServiceStatus>> = [];

        // trigger all simple status checks
        healthCheckProms.push(...triggerSimpleStatusChecks(req, ctx));

        // trigger more complex checks
        healthCheckProms.push(...triggerHealthChecks(ctx));

        // wait for all services status
        Promise.all(healthCheckProms.map((prom: Promise<commonModel.IUIServiceStatus>) => prom.catch((err: Error) => err)))
            .then((results: commonModel.IUIServiceStatus[]) => {
                for (const serviceStatus of results) {
                    status.services[serviceStatus.id] = serviceStatus.status;

                    // if there are details, we want to see them, too!
                    if (serviceStatus.details) {
                        status.details[serviceStatus.id] = serviceStatus.details;
                    }
                }

                // send the result
                const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, status);
                logger.debug(ctx, `${fn}< 200 - status - duration: ${result.duration}ms`);
                res.status(200).send(result);
            });
    } catch (err) {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
            logger.error(ctx, `${fn}- Failed to retrieve health status`, err);
            error = new commonErrors.FailedToGetHealthStatusError(err);
        }

        const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
        logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
        res.status(result.statusCode).send(result);
    }
}

export function getAppConfiguration(req, res): void {
    const fn = 'getAppConfiguration ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    try {
        const configuration: { [key: string]: string } = {};

        configuration.coligoEnvironments = nconf.get('coligoEnvironments');
        configuration.coligoLoggerDisabled = nconf.get('coligoLoggerDisabled');
        configuration.coligoPerfLoggingDisabled = nconf.get('coligoPerfLoggingDisabled');
        configuration.coligoPerfMonitoringDisabled = nconf.get('coligoPerfMonitoringDisabled');
        configuration.coligoResourcePlanId = nconf.get('coligoResourcePlanId');
        configuration.coligoResourceId = nconf.get('coligoResourceId');
        configuration.coligoTokenCacheTtl = nconf.get('coligoTokenCacheTtl');
        configuration.coligoUsabillaDisabled = nconf.get('coligoUsabillaDisabled');
        configuration.iamGlobalUrl = nconf.get('iamGlobalUrl');
        configuration.resourceControllerUrl = nconf.get('resourceControllerUrl');
        configuration.bluemixHost = nconf.get('bluemixHost');

        // send the result
        const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, configuration);
        logger.debug(ctx, `${fn}< 200 - configuration - duration: ${result.duration}ms`);
        res.status(200).send(result);
    } catch (err) {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
            logger.error(ctx, `${fn}- Failed to retrieve app configuration`, err);
            error = new commonErrors.FailedToGetAppConfigurationError(err);
        }

        const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
        logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
        res.status(result.statusCode).send(result);
    }
}

export function getColigoContext(req, res): void {
    const fn = 'getColigoContext ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    try {
        const clgContext = middlewareUtils.decomposeTheColigoId(req.params.clgId);

        // send the result
        const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, clgContext);
        logger.debug(ctx, `${fn}< 200 - configuration - duration: ${result.duration}ms`);
        res.status(200).send(result);
    } catch (err) {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
            logger.error(ctx, `${fn}- Failed to decompose the coligo Id`, err);
            error = new commonErrors.FailedToGetColigoContextError(err);
        }

        const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
        logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
        res.status(result.statusCode).send(result);
    }
}

export function receiveClientLogs(req, res) {
    const fn = 'receiveClientLogs ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    const logPayload: any = req.body;

    try {

        if (logPayload && logPayload.logs && Array.isArray(logPayload.logs)) {
            logger.debug(ctx, `${fn}- received ${logPayload.logs.length} log messages`);
            for (const clientLogMessage of logPayload.logs) {

                // TODO we may want to add other variables, too

                // create the log message
                const logMessage = `${fn}- client-side-log - ${clientLogMessage.timestamp} - ${clientLogMessage.logger}.${clientLogMessage.message}`;

                // log the payload with the appropriate level
                if (clientLogMessage.level === 'error') {
                    logger.error(ctx, logMessage);
                } else if (clientLogMessage.level === 'warn') {
                    logger.warn(ctx, logMessage);
                } else if (clientLogMessage.level === 'info') {
                    logger.debug(ctx, logMessage);
                } else {
                    logger.debug(ctx, logMessage);
                }
            }
        }

        // send the result
        const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK);
        logger.debug(ctx, `${fn}< 200 duration: ${result.duration}ms`);
        res.status(200).send(result);
    } catch (err) {
        let error = err;
        if (!(err instanceof commonErrors.GenericUIError)) {
            logger.error(ctx, `${fn}- Failed to decompose the coligo Id`, err);
            error = new commonErrors.FailedToLogClientSideError(err);
        }

        const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
        logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
        res.status(result.statusCode).send(result);
    }
}
