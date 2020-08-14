/**
 * IBM Confidential
 * Licensed Materials - Property of IBM
 * IBM Cloud Container Service, 5737-D43
 * (C) Copyright IBM Corp. 2018 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */
import * as loggerUtil from '@console/console-platform-log4js-utils';
import * as commonModel from '../../../common/model/common-model';
import * as monitoringModel from '../model/monitoring-model';
import * as middlewareUtils from '../utils/middleware-utils';

const COMPONENT = 'i18n';
const logger = loggerUtil.getLogger(`clg-ui:endpoints:${COMPONENT}`);

// Specify the default lang to use
const defaultLang = 'en';

const sampleNlsKey = 'clg.common.label.create';

/**
 * Helper function that extends the given obj map with the src map.
 * @param obj {Map}
 * @param src {Map}
 */
function extendMap(obj, src) {
  for (const key in src) {
    if (!obj.hasOwnProperty(key)) { obj[key] = src[key]; }
  }
  return obj;
}

export function loadBundleInternal(req, res, ctx: commonModel.IUIRequestContext) {
  const fn = 'loadBundle ';
  logger.trace(`${fn}> i18n.language: '${req.i18n.language}', defaultLang: '${defaultLang}'`);

  // prepare performance monitoring
  const monitor: monitoringModel.IPerformanceMonitor = {
    kind: 'api',
    name: `${COMPONENT}::loadBundle`,
  };

  let lang = req.i18n.language || defaultLang;

  // load the default bundle
  const defaultBundleContent = req.i18n.getResourceBundle(defaultLang);

  let loadedBundleContent;
  if (defaultLang !== lang) {
    logger.trace(`${fn}- loading a bundle for lang '${lang}'`);

    // load the bundle
    loadedBundleContent = req.i18n.getResourceBundle(lang);

    // fallback: strip the specifc country type (e.g. en-us -> en)
    if ((!loadedBundleContent || loadedBundleContent.size === 0) && req.i18n.language.includes('-')) {

      const baseLang = lang.substring(0, lang.indexOf('-'));
      logger.info(`${fn}- Failed to load NLS bundle for lang '${lang}' -> loading base '${baseLang}'`);
      lang = baseLang;
      loadedBundleContent = req.i18n.getResourceBundle(lang);
    }

    // fallback: use the default bundle
    if ((!loadedBundleContent || loadedBundleContent.size === 0)) {
      logger.info(`${fn}- Failed to load NLS bundle for lang '${lang}' -> loading default`);
      lang = defaultLang;
    }

    if (loadedBundleContent) {
      logger.trace(`${fn}- loadedBundleContent: ${sampleNlsKey}=${loadedBundleContent[sampleNlsKey]}`);
    }
  }

  // decide which bundle to use
  let bundleContent;
  if (defaultLang === lang) {
    logger.trace(`${fn}- using default bundle '${lang}'`);
    // use the default bundle
    bundleContent = defaultBundleContent;
  } else {
    // merge the bundles
    bundleContent = extendMap(loadedBundleContent, defaultBundleContent);
  }

  const responseBody = {
    bundle: bundleContent,
    lng: lang,
  };

  const result: commonModel.IUIRequestResult = middlewareUtils.createUIRequestResult(ctx, monitor, commonModel.UIRequestStatus.OK, responseBody);
  logger.debug(`${fn}< 200 - lang: '${lang}' - duration: ${result.duration}ms`);
  res.status(200).send(result);
}

export function loadBundle(req, res) {
  return loadBundleInternal(req, res, middlewareUtils.constructRequestContext(req));
}
