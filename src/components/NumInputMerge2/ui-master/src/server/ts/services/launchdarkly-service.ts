/**
 * IBM Confidential
 * Licensed Materials - Property of IBM
 * IBM Cloud Container Service, 5737-D43
 * (C) Copyright IBM Corp. 2018 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

import * as loggerUtil from '@console/console-platform-log4js-utils';
import * as LaunchDarkly from 'launchdarkly-node-server-sdk';

import * as commonModel from '../../../common/model/common-model';

const COMP_NAME = 'launchdarkly';
const logger = loggerUtil.getLogger(`clg-ui:service:${COMP_NAME}`);

// Don't bother trying to init the LD client if running unit tests
let client;

export function init() {
  client = LaunchDarkly.init(process.env.LAUNCH_DARKLY_SDK_KEY);
}

// istanbul ignore next
if (!process.env.running_under_istanbul) { init(); }

const getUser = (req) => {
  if (!req.user) { return { key: 'unknown', anonymous: true }; }
  return {
    custom: {
      bssAccountID: req.user.bss_account,
      imsAccountID: req.user.ims_account,
    },
    email: req.user.username || (req.user.emails && req.user.emails.length > 0 && req.user.emails[0].value),
    key: req.user.iam_id,
    // name: req.user.displayName,
    // firstName: req.user.name && req.user.name.givenName,
    // lastName: req.user.name && req.user.name.familyName,
    privateAttributeNames: ['email'],
  };
};

// Get one or more feature flags. If `names` is a string then the value is passed directly to the
// callback function. If `names` is an array then an object is passed to the callback function.
export function getFlag(req, names, callback) {
  const user = getUser(req);
  if (Array.isArray(names)) {
    let done = 0;
    const flags = {};
    names.forEach((n) => {
      client.variation(n, user, false, (err, value) => {
        flags[n] = value;
        done += 1;
        if (err) { logger.error(`Error getting Launch Darkly flag '${n}' for user ${user.key}: ${err}`); }
        if (done === names.length) { callback(flags); }
      });
    });
  } else {
    client.variation(names, user, false, (err, value) => {
      if (err) { logger.error(`Error getting Launch Darkly flag '${names}' for user ${user.key}: ${err}`); }
      callback(value);
    });
  }
}

export function getServiceStatus(ctx: commonModel.IUIRequestContext): Promise<commonModel.IUIServiceStatus> {
  const fn = 'getServiceStatus ';
  logger.debug(`${fn}>`);

  const launchDarklyStatus: commonModel.IUIServiceStatus = {
    id: COMP_NAME,
    status: 'ERROR',
  };

  return new Promise<commonModel.IUIServiceStatus>((resolve, reject) => {
    getFlag(ctx, 'coligo-launchdarkly', (value) => {
      if (!value || value === 'UNKNOWN') {
        launchDarklyStatus.status = 'FAILED';
      } else {
        launchDarklyStatus.status = 'OK';
        launchDarklyStatus.details = value;
      }
      logger.debug(`${fn}< ${JSON.stringify(launchDarklyStatus)}`);
      resolve(launchDarklyStatus);
    });
  });
}

export function getFlagSync(req, names) {
  return new Promise((resolve) => getFlag(req, names, resolve));
}
