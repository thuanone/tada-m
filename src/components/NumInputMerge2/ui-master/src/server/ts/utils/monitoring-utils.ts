import * as loggerUtil from '@console/console-platform-log4js-utils';
const logger = loggerUtil.getLogger('clg-ui:utils:monitoring');

import * as commonModel from '../../../common/model/common-model';
import * as monitoringModel from '../model/monitoring-model';
import * as launchdarkly from '../services/launchdarkly-service';
import * as cacheUtils from '../utils/cache-utils';

const MONITOR_APP: string = 'coligo';
const MONITOR_TYPE: string = 'coligo-performance-metric';

const PERFORMANCE_MONITORING_FEATURE_FLAG = 'coligo-ui-feature-perfmonitoring';
const PERFORMANCE_LOGGING_FEATURE_FLAG = 'coligo-ui-feature-perflogging';

function isClgPerfLoggingDisabled(): boolean {
  return process.env.coligoPerfLoggingDisabled === 'true';
}

function isClgPerfMonitoringDisabled(): boolean {
  return process.env.coligoPerfMonitoringDisabled === 'true';
}

// TTL in seconds
const PERFORMANCE_MONITORS_CACHE_TTL = 60 * 60 * 6; // six hours
const performanceMonitoringCache = cacheUtils.getCacheInstance('performance-monitoring', PERFORMANCE_MONITORS_CACHE_TTL);

interface IPerformanceLogEntry {
  app: string;
  duration: number;
  error?: boolean;
  id: string;
  kind: string;
  message: string;
  success: boolean;
  tid: string;
  type: string;
}

export interface IPerformanceMonitorEntry {
  id: string;
  hits: number;
  avg: number;
  min: number;
  max: number;
  total: number;
  lastValue: number;
  lastAccessed: string;
}

interface IPerformanceMonitors {
  [key: string]: IPerformanceMonitorEntry;
}

export function createPerfLogEntry(ctx: commonModel.IUIRequestContext, monitor: monitoringModel.IPerformanceMonitor, duration: number, success: boolean, error: boolean): void {

  // check whether this feature is disabled through an env variable
  if (isClgPerfLoggingDisabled()) {
    return;
  }

  // evaluate the feature flag that decides whether these log entries shall be written
  launchdarkly.getFlagSync({}, PERFORMANCE_LOGGING_FEATURE_FLAG).then((value: boolean) => {
    if (value !== true) {
      // if the feature flag did not evaluate to true, stop here
      return;
    }

    // create the log entry object
    // LOGDNA will decompose the JSON string and will
    // allow to query for all of the object properties
    const perfLogMessage: IPerformanceLogEntry = {
      app: MONITOR_APP,
      duration,
      id: monitor.name || 'UNKNOWN',
      kind: monitor.kind || 'unknown-kind',
      message: `${MONITOR_TYPE} - Finished monitor '${monitor.name || 'UNKNOWN'}' in ${duration}ms`,
      success,
      tid: ctx.tid,
      type: MONITOR_TYPE,
    };

    if (error) {
      perfLogMessage.error = error;
    }

    // log the message in order to allow performance analysis in LogDNA
    logger.info(JSON.stringify(perfLogMessage));
  }).catch((err) => {
    logger.error(`Error while evaluating LaunchDarkly feature flag '${PERFORMANCE_LOGGING_FEATURE_FLAG}'`, err);
  });
}

function getPerformanceMonitorFromCache(monitorId: string): IPerformanceMonitorEntry {
  try {
    return performanceMonitoringCache.get(undefined, monitorId, false);
  } catch (e) {
    logger.error(`Failed to retrieve monitor '${monitorId}' from in-memory monitor cache`, e);
  }
}

function storePerformanceMonitorInCache(monitorId: string, performanceMonitor: IPerformanceMonitorEntry) {
  performanceMonitoringCache.put(undefined, monitorId, performanceMonitor, PERFORMANCE_MONITORS_CACHE_TTL, false);
}

export function storePerfMonitorEntry(monitor: monitoringModel.IPerformanceMonitor, duration: number): void {

  // check whether this feature is disabled through an env variable
  if (isClgPerfMonitoringDisabled()) {
    return;
  }

  // evaluate the feature flag that decides whether these entries shall be calculated and stored
  launchdarkly.getFlagSync({}, PERFORMANCE_MONITORING_FEATURE_FLAG).then((value: boolean) => {

    if (value !== true) {
      // if the feature flag did not evaluate to true, stop here
      return;
    }

    // build the monitor identifier, by putting the kind and the name together
    const monitorId = `${monitor.kind || 'unknown-kind'}::${monitor.name || 'unknown-name'}`;

    // check whether there is already a cache entry for this monitor
    let perfMonitor = getPerformanceMonitorFromCache(monitorId);

    if (perfMonitor) {

      // use the current stats of this monitor as baseline
      const oldEntry: IPerformanceMonitorEntry = perfMonitor;

      // calculate new stats based on the old ones
      const newEntry: IPerformanceMonitorEntry = {
        avg: parseFloat(((oldEntry.total + duration) / (oldEntry.hits + 1)).toFixed(3)),
        hits: 1 + oldEntry.hits,
        id: monitorId,
        lastAccessed: new Date().toISOString(),
        lastValue: duration,
        max: oldEntry.max > duration ? oldEntry.max : duration,
        min: oldEntry.min < duration ? oldEntry.min : duration,
        total: oldEntry.total + duration,
      };

      perfMonitor = newEntry;
    } else {

      // create a new monitor entry, in case there was none before
      const monitorEntry: IPerformanceMonitorEntry = {
        avg: duration,
        hits: 1,
        id: monitorId,
        lastAccessed: new Date().toISOString(),
        lastValue: duration,
        max: duration,
        min: duration,
        total: duration,
      };
      perfMonitor = monitorEntry;
    }

    // write this info into the cache
    storePerformanceMonitorInCache(monitorId, perfMonitor);

  }).catch((err) => {
    logger.error(`error while evaluating LaunchDarkly feature flag '${PERFORMANCE_MONITORING_FEATURE_FLAG}'`, err);
  });
}

export function getPerfMonitors(ctx: commonModel.IUIRequestContext): Promise<IPerformanceMonitorEntry[]> {
  return new Promise<IPerformanceMonitorEntry[]>((resolve, reject) => {
    // retrieve all monitors from the cache
    const perfMonitors: IPerformanceMonitors = performanceMonitoringCache.getInternalCache().mget(performanceMonitoringCache.getInternalCache().keys());

    // convert the object to an array and return it
    resolve(Object.values(perfMonitors));
  });
}
