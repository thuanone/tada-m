import * as errors from '../../../common/Errors';

import * as commonModel from '../../../common/model/common-model';
import { brokerApi } from '../services/mock/broker-service';
import * as middlewareUtils from '../utils/middleware-utils';
import { getClgContext, getClgMonitor } from '../utils/request-context-utils';
// import * as brokerApi from '../services/brokerapi-service';

const COMPONENT = 'broker';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger(`clg-ui:endpoints:${COMPONENT}`);

/**
 * GET lifted limitations boolean for certain user from the Broker API
 * @param req
 * @param res
 */
export const getLiftedLimitations = (req, res) => {
    const fn = 'getLiftedLimitations ';
    const ctx = getClgContext(req);
    logger.debug(ctx, `${fn}>`);

    // retrieve all request parameters
    const regionId: string = req.params.regionId;

    brokerApi.getLiftedLimitations(ctx, regionId)
        .then((value) => {
            const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, getClgMonitor(req), commonModel.UIRequestStatus.OK, value);
            logger.debug(ctx, `${fn}< 200 - liftedLimitations? ${value} - duration: ${result.duration}ms`);
            res.status(200).send(result);
        })
        .catch((err) => {
            let error = err;
            if (!(err instanceof errors.GenericUIError)) {
                logger.error(ctx, `${fn}- Failed to retrieve the limitiations status information of region '${regionId}'`, err);
                error = new errors.UnknownError(err);
            }

            const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, getClgMonitor(req), 400, error);
            logger.debug(ctx, `${fn}< ${result.statusCode} - duration: ${result.duration}ms`);
            res.status(result.statusCode).send(result);
        });
};
