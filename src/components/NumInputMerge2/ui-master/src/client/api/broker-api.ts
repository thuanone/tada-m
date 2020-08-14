// 3rd-party
import * as log from 'loglevel';

import utils from './utils';
import {IUIRequestResult} from '../../common/model/common-model';
const config = window.armada.config;

const logger = log.getLogger('api/broker-api');

/**
 * This method gets the liftedLimitations? boolean for a certain user
 * @param regionId
 * @param always fn called always
 */
export function getLiftedLimitations(regionId: string, always?): Promise<boolean> {
  const fn = 'getLiftedLimitations ';
  logger.debug(`${fn}> regionId: '${regionId}'`);

  const getResult = utils.doGet({
    url: `${config.proxyRoot}api/core/v1/region/${regionId}/broker/lift-limitations`,
  });
  return new Promise((resolve, reject) => {
    getResult.done((result: IUIRequestResult) => {
      logger.debug(`${fn}< SUCCESS - result: '${JSON.stringify(result)}'`);
      resolve(result.payload);
    }).fail((xhr) => {
      logger.debug(`${fn}< ERROR - result: '${JSON.stringify(xhr)}'`);
      reject(utils.transformErrorResponse(xhr));
    }).always(always);
  });
}
