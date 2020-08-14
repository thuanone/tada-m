import * as commonModel from '../../../common/model/common-model';
import * as monitoringModel from '../model/monitoring-model';
import { constructRequestContext } from './middleware-utils';

export const setClgContext = (routeId: string) => {
  return (req, res, next) => {

    // store the route id the request
    req.clgRoute = routeId;

    // create the ctx and store it in the request
    const ctx: commonModel.IUIRequestContext = constructRequestContext(req);
    req.clgCtx = ctx;

    // create a monitor and store it, too
    const monitor: monitoringModel.IPerformanceMonitor = {
      kind: 'api',
      name: routeId,
    };
    req.clgMonitor = monitor;

    next();
  };
};

export const addClgContext = (req, res, next) => {

    // create the ctx and store it in the request
    const ctx: commonModel.IUIRequestContext = constructRequestContext(req);
    req.clgCtx = ctx;

    next();
};

export function getClgContext(req: any): commonModel.IUIRequestContext {
  return req && req.clgCtx;
}

export function getClgMonitor(req: any): monitoringModel.IPerformanceMonitor {
  return req && req.clgMonitor;
}

export function getClgRoute(req: any): string {
  return req && req.clgRoute;
}
