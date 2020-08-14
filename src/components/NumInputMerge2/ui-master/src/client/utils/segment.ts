// bluemix analytics documentation
// https://pages.github.ibm.com/Bluemix/platform-analytics/development/dev-schema/#track-events-for-tightly-coupled-offerings

import * as commonModel from '../../common/model/common-model';
import context from './context';
import win from './window';

function setCategoryInfo(category, props) {
  const newProps = Object.assign({}, props);
  // TODO: add additional type checks for new categories
  if (category === 'codeengine') {
    newProps.productTitle = 'Code Engine'; // see: https://pages.github.ibm.com/Bluemix/platform-analytics/development/dev-schema/#producttitle-property
    newProps.category = 'Offering Interface'; // see: https://pages.github.ibm.com/Bluemix/platform-analytics/development/dev-schema/#category-property
  }
  return newProps;
}

function setUserInfo(props, accountData) {
  const newProps = Object.assign(props, {});
  const armada = win.get('armada');
  newProps.region = context.getRegion();
  newProps.environment = armada.consoleEnv || 'stage';
  return newProps;
}

function createEventProps(category: string, props: any, accountData) {
  return setUserInfo(setCategoryInfo(category, props), accountData);
}

const trackEvent = (eventType: commonModel.SegmentEventTypes, props: any) => {
  const analytics = win.get('bluemixAnalytics');
  if (analytics && analytics.trackEvent) {
    context.getAccountData((accountData) => {
      const fullProps = createEventProps('codeengine', props, accountData);
      analytics.trackEvent(eventType, fullProps);
    });
  }
};

// https://segment-standards.w3bmix.ibm.com/events/custom-event
const succeededCustomEvent = (action: commonModel.SegmentCustomEventActions, objectType: commonModel.SegmentCodeEngineObjectTypes, name: string, resultValue?: string) => {
  trackEvent(commonModel.SegmentEventTypes.CUSTOM, {
    action: action || commonModel.SegmentCustomEventActions.UNKNOWN,
    object: name || '',
    objectType,
    resultValue: resultValue || `Success: ${action || commonModel.SegmentCustomEventActions.UNKNOWN} ${objectType}`,
    successFlag: true,
  });
};

// https://segment-standards.w3bmix.ibm.com/events/created-object
const succeededCreationEvent = (objectType: commonModel.SegmentCodeEngineObjectTypes, name: string, resultValue?: string) => {
  trackEvent(commonModel.SegmentEventTypes.CREATED, {
    object: name || '',
    objectType,
    resultValue: resultValue || `Success: created ${objectType}`,
    successFlag: true,
  });
};

// https://segment-standards.w3bmix.ibm.com/events/updated-object
const succeededUpdateEvent = (objectType: commonModel.SegmentCodeEngineObjectTypes, name: string, resultValue?: string) => {
  trackEvent(commonModel.SegmentEventTypes.UPDATED, {
    object: name || '',
    objectType,
    resultValue: resultValue || `Success: updated ${objectType}`,
    successFlag: true,
  });
};

// https://segment-standards.w3bmix.ibm.com/events/deleted-object
const succeededDeletionEvent = (objectType: commonModel.SegmentCodeEngineObjectTypes, name: string, resultValue?: string) => {
  trackEvent(commonModel.SegmentEventTypes.DELETED, {
    object: name || '',
    objectType,
    resultValue: resultValue || `Success: deleted ${objectType}`,
    successFlag: true,
  });
};

const failedCreationEvent = (objectType: commonModel.SegmentCodeEngineObjectTypes, name: string, resultValue?: string) => {
  trackEvent(commonModel.SegmentEventTypes.CREATED, {
    object: name || '',
    objectType,
    resultValue: resultValue || `Failed: creating ${objectType}`,
    successFlag: false,
  });
};

const failedCustomEvent = (action: commonModel.SegmentCustomEventActions, objectType: commonModel.SegmentCodeEngineObjectTypes, name: string, resultValue?: string) => {
  trackEvent(commonModel.SegmentEventTypes.CUSTOM, {
    action: action || commonModel.SegmentCustomEventActions.UNKNOWN,
    object: name || '',
    objectType,
    resultValue: resultValue || `Success: ${action || commonModel.SegmentCustomEventActions.UNKNOWN} ${objectType}`,
    successFlag: false,
  });
};

const failedUpdateEvent = (objectType: commonModel.SegmentCodeEngineObjectTypes, name: string, resultValue?: string) => {
  trackEvent(commonModel.SegmentEventTypes.UPDATED, {
    object: name || '',
    objectType,
    resultValue: resultValue || `Failed: updating ${objectType}`,
    successFlag: false,
  });
};

const failedDeletionEvent = (objectType: commonModel.SegmentCodeEngineObjectTypes, name: string, resultValue?: string) => {
  trackEvent(commonModel.SegmentEventTypes.DELETED, {
    object: name || '',
    objectType,
    resultValue: resultValue || `Failed: deleting ${objectType}`,
    successFlag: false,
  });
};

const pageEvent = (category, pageID) => {
  const analytics = win.get('bluemixAnalytics');
  if (analytics && analytics.pageEvent) {
    analytics.pageEvent(category, pageID);
  }
};

export {
  trackEvent,
  succeededCreationEvent,
  succeededCustomEvent,
  succeededDeletionEvent,
  succeededUpdateEvent,
  failedCreationEvent,
  failedCustomEvent,
  failedDeletionEvent,
  failedUpdateEvent,
  pageEvent
};
