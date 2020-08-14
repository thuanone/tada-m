import * as errors from '../../../common/Errors';

import * as commonModel from '../../../common/model/common-model';
import * as configMiddleware from '../middleware/config-middleware';
import * as middlewareUtils from '../utils/middleware-utils';
import { getClgContext, getClgMonitor } from '../utils/request-context-utils';

const COMPONENT = 'configitems';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:endpoints:${COMPONENT}`);

export function listConfigItems(req, res): void {
    const fn = 'listConfigItems ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    const regionId: string = req.params.regionId;
    const projectId: string = req.params.projectId;

    configMiddleware.listConfigItems(ctx, regionId, projectId)
        .then((list) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, list);
            logger.debug(ctx, `${fn}< 200 - ${ list ? list.length : 'NULL' } config items - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve config items from project '${projectId}' of region '${regionId}'`, err);
                error = new errors.FailedToGetConfigItemsError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
}
