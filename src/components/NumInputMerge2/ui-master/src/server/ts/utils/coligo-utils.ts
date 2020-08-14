/**
 * IBM Confidential
 * Licensed Materials - Property of IBM
 * IBM Cloud Container Service, 5737-D43
 * (C) Copyright IBM Corp. 2018 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */
import loggerUtil = require('@console/console-platform-log4js-utils');
const logger = loggerUtil.getLogger('clg-ui:utils:coligo');

import * as projModel from '../../../common/model/project-model';

interface IColigoEnvironments {
  [key: string]: string;
}

let environments: IColigoEnvironments;

function getColigoEnvironments(): IColigoEnvironments {
  if (environments) {
    return environments;
  }
  try {
    environments = process.env.coligoEnvironments ? JSON.parse(process.env.coligoEnvironments) : {};
  } catch (err) {
    logger.error(`Failed to parse the env property 'coligoEnvironments': '${process.env.coligoEnvironments}'`, err);
    environments = {};
  }
  return environments;
}

/**
 * Retrieves the control plane base url for the given regionId
 * @param {String} regionId the identifier of the region (e.g. us-south)
 */
export function getControlPlaneUrl(regionId: string) {
  const fn = 'getControlPlaneUrl ';
  logger.trace(`${fn}> regionId: '${regionId}'`);

  if (!regionId) {
    logger.trace(`${fn}< NULL - regionId must not be empty or null!`);
    return null;
  }
  const loweredId = regionId.toLowerCase();
  const mtControlPlaneBaseUrl = getColigoEnvironments()[loweredId];
  if (mtControlPlaneBaseUrl) {
    logger.trace(`${fn}< controlPlane host: '${mtControlPlaneBaseUrl}'`);
    return `https://${mtControlPlaneBaseUrl}`;
  }

  logger.trace(`${fn}< NULL`);
  return null;
}

/**
 * Checks whether the given region Id matches a known identifier of a multi-tenant environment
 * @param {String} regionId the identifier of the region
 */
export function isMultitenantRegion(regionId: string) {
  if (!regionId) {
    return false;
  }
  const loweredId = regionId.toLowerCase();
  const isMtRegion = loweredId in getColigoEnvironments();
  return isMtRegion;
}

export function getRegions(): projModel.IUIRegions {
  return Object.keys(getColigoEnvironments()).map((regionKey) => ({ id: regionKey }));
}
