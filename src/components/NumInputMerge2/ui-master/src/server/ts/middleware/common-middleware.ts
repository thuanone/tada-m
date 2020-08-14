/**
 * Common (helper) methods for all middleware modules
 */

import * as commonErrors from '../../../common/Errors';
import * as commonModel from '../../../common/model/common-model';
import {IAccessDetails} from '../model/access-details-model';
import * as coligoService from '../services/coligo-service';
import * as coligoUtils from '../utils/coligo-utils';

export function retrieveKubeApiAccessDetails(logger, regionId: string, projectId: string, ctx: commonModel.IUIRequestContext): Promise<IAccessDetails> {
    const fn = 'retrieveKubeApiAccessDetails ';

    // retrieve the access details of this namespace / cluster
    if (coligoUtils.isMultitenantRegion(regionId)) {
        logger.debug(`${fn}- retrieving the namespace access details for the project '${projectId}' in MT cluster '${regionId}'`);
        return coligoService.retrieveNamespaceAccessDetails(ctx, regionId, projectId)
            .catch((err) => {
                let error = err;
                if (!(err instanceof commonErrors.GenericUIError)) {
                    logger.error(`${fn}- Failed to retrieve access details for region '${regionId}' and project '${projectId}'`, err);
                    // wrap the error object in a specifc coligo error object
                    error = new commonErrors.FailedToGetProjectsNamespaceConfigError(projectId, regionId, err);
                }

                logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
                return Promise.reject(error);
            });
    } else {
        return Promise.reject(new commonErrors.FailedToGetProjectsNamespaceConfigDueToInvalidParametersError(projectId, regionId));
    }
}
