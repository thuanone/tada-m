import * as blueProm from 'bluebird';

import * as commonErrors from '../../../common/Errors';
import { IUIRequestContext } from '../../../common/model/common-model';
import { IUIConfigMap, IUIGenericSecret } from '../../../common/model/config-model';
import * as confMapMiddleware from './confmap-middleware';
import * as secretsMiddleware from './secret-middleware';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger('clg-ui:middleware:components');

const MAX_COMPONENT_COUNT = 500; // maximum number of items in the combined jobdef & application list

type IUIComponents = any[];

function sortByCreated(a, b) {
    return b.created - a.created;
}

function mergeConfMapsAndSecrets(confMaps: IUIConfigMap[], secrets: IUIGenericSecret[]): any[] {
    let result = [];
    let confMapIdx = 0;
    let secretIdx = 0;

    while (confMapIdx < confMaps.length && secretIdx < secrets.length) {
        if (sortByCreated(confMaps[confMapIdx], secrets[secretIdx]) > 0) {
            result.push(secrets[secretIdx++]);
        } else {
            result.push(confMaps[confMapIdx++]);
        }
    }

    if (secretIdx < secrets.length) {
        result = result.concat(secrets.slice(secretIdx));
    } else {
        result = result.concat(confMaps.slice(confMapIdx));
    }

    return result;
}

export function listConfigItems(ctx: IUIRequestContext, regionId: string, projectId: string): Promise<IUIComponents> {
    const fn = 'listConfigItems ';
    logger.debug(ctx, `${fn}> regionId: '${regionId}', projectId: '${projectId}'`);

    return new Promise<IUIComponents>((resolve, reject) => {
        const confMapPromise = confMapMiddleware.listConfigMaps(ctx, regionId, projectId);

        const secretsPromise = secretsMiddleware.listSecrets(ctx, regionId, projectId, 'generic');

        // use bluebird join function to wait for the results of both calls
        blueProm.join(confMapPromise, secretsPromise, (configMaps: IUIConfigMap[], secrets: IUIGenericSecret[]) => {

            const mergedList = mergeConfMapsAndSecrets(configMaps, secrets);
            logger.debug(ctx, `${fn}< ${mergedList && mergedList.length} config items`);
            resolve(mergedList);
        }).catch((err) => {
            let error = err;
            if (!(err instanceof commonErrors.GenericUIError)) {
            logger.error(ctx, `${fn}- Failed to get the config items in region '${regionId}' and project '${projectId}'`, err);
            // wrap the error object in a specifc coligo error object
            error = new commonErrors.FailedToGetConfigItemsError(err);
            }
            logger.debug(ctx, `${fn}< ERR - ${commonErrors.stringify(error)}`);
            reject(error);
        });
    });
}
