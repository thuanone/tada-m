import * as commonModel from '../../../common/model/common-model';
import * as commonErrors from './../../../common/Errors';

import * as monitorModel from '../model/monitoring-model';
import * as monitorUtils from './monitoring-utils';

import * as loggerUtil from '@console/console-platform-log4js-utils';
const logger = loggerUtil.getLogger('clg-ui:api');

const USERID_ANONYMOUS = '0000000001';
const USERID_PREFIX = 'IBMid-';

export function createUIRequestResult(ctx: commonModel.IUIRequestContext, monitor: monitorModel.IPerformanceMonitor, status: commonModel.UIRequestStatus, payload?: any): commonModel.IUIRequestResult {
    const duration = Date.now() - ctx.startTime;

    // log this entry to get more insights on the service performance
    monitorUtils.createPerfLogEntry(ctx, monitor, duration, commonModel.UIRequestStatus.OK === status, false);

    monitorUtils.storePerfMonitorEntry(monitor, duration);

    // create a coligoId that can be later used to track the request in the logs
    const clgId = craftTheColigoId(ctx);

    return {
        clgId,
        duration,
        payload,
        status,
    };
}

export function createUIRequestError(ctx: commonModel.IUIRequestContext, monitor: monitorModel.IPerformanceMonitor, statusCode: number, error: commonErrors.GenericUIError): commonModel.IUIRequestError {
    const duration = Date.now() - ctx.startTime;

    // log this entry to get more insights on the service performance
    monitorUtils.createPerfLogEntry(ctx, monitor, duration, false, true);

    monitorUtils.storePerfMonitorEntry(monitor, duration);

    // create a coligoId that can be later used to track the request in the logs
    const clgId = craftTheColigoId(ctx, error);

    return new commonModel.UIRequestError(clgId, statusCode, ctx.startTime, error);
}

export function createUIOperationResult(status: commonModel.UIOperationStatus, error?: commonErrors.GenericUIError): commonModel.IUIOperationResult {
    return {
        error,
        status,
    };
}

function getHoursSince1970(): number {
    return Math.floor(Date.now() / 1000 / 60 / 60);
}

function getShortenedUserId(user: any): string {
    if (!user || !user.id) {
        return USERID_ANONYMOUS; // dummy id for unauthenticated
    }

    // remove the UID prefix to short the id
    const idPrefix = USERID_PREFIX;
    if (user.id.startsWith(idPrefix)) {
        return user.id.substring(idPrefix.length);
    }
    return user.id;
}

function craftTheColigoId(ctx: commonModel.IUIRequestContext, error?: commonErrors.GenericUIError) {
    return `${ctx.tid}.${getHoursSince1970()}.${getShortenedUserId(ctx.user)}${error ? `.${error._code}` : ''}`;
}

export function decomposeTheColigoId(clgId: string): any {

    if (!clgId || clgId.indexOf('.') === -1) {
        return {};
    }

    const parts = clgId.split('.');

    return {
        date: new Date(parseInt(parts[1], 10) * 60 * 60 * 1000),
        error: parts[3] ? parts[3] : undefined,
        tid: parts[0],
        user: parts[2] === USERID_ANONYMOUS ? 'Anonymous' : `${USERID_PREFIX}${parts[2]}`,
    };
}

function generateTid(): string {
    return `coligo-ui-${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 8)}`;
}

export function constructRequestContext(req): commonModel.IUIRequestContext {
    return {
        session: req.session,
        startTime: Date.now(),
        tid: generateTid(),
        user: req.user,
    };
}

/**
 * Returns the provided jsonVal as a number typed value, even if the input value is of type string.
 * If the input value is either null, undefined or cannot be parsed as a decimal number, the method
 * returns undefined.
 *
 * @param jsonVal
 */
export function ensureNumberOrUndefined(jsonVal) {
   let result;

   if (typeof jsonVal === 'number') {
       result = jsonVal;
   } else if (typeof jsonVal === 'string') {
       try {
           result = parseInt(jsonVal, 10);
       } catch {
           result = undefined;
       }
   }

   return result;
}

/**
 * Returns jsonValA if it is defined and jsonValB in any other case.
 * If both are undefined, the result will therefore also be undefined.
 *
 * @param jsonValA
 * @param jsonValB
 */
export function valueAOrB(jsonValA, jsonValB) {
   return jsonValA || jsonValB;
}

/**
 * Converts a given number of seconds (provided as a number or number-in-a-string) from a JSON value
 * into a number of milliseconds safely. If the input value is not a number or undefined, it just returns
 * undefined, but does not throw an error.
 *
 * @param num
 */
export function safeSecondsToMillis(jsonVal) {
    const num = ensureNumberOrUndefined(jsonVal);
    return num ? num * 1000 : num;
}
