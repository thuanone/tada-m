// react
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import {
  CheckmarkFilled16,
  ErrorFilled16,
  InformationFilled16,
  WarningFilled16,
} from '@carbon/icons-react';
import {
  InlineLoading,
} from '@console/pal/carbon-components-react';

// coligo
import * as appModel from '../../../common/model/application-model';
import {
  UIEntityKinds,
  UIEntityStatus,
} from '../../../common/model/common-model';
import t from '../i18n';

const COMPONENT = 'utils:formatter:appstatus';
const logger = log.getLogger(COMPONENT);

const STATE_FAILED = 'failed';
const STATE_READY = 'ready';
const STATE_WARNING = 'warning';
const STATE_DEPLOYING = 'deploying';

function getReadyCondition(statusConditons: appModel.IUIApplicationStatusCondition[]): appModel.IUIApplicationStatusCondition {
  for (const statusConditon of statusConditons) {
    if (statusConditon.type === 'Ready') {
      return statusConditon;
    }
  }

  return undefined;
}

function getAppState(application: appModel.IUIApplication) {

  if (application.status === UIEntityStatus.READY) {
    return STATE_READY;
  } else if (application.status === UIEntityStatus.FAILED) {

    // check the status condition 'Ready' of the latest revision
    if (application.revision && application.revision.statusConditions) {
      const revReadyCondition = getReadyCondition(application.revision.statusConditions);
      if (revReadyCondition && revReadyCondition.status === 'False') {
        return STATE_WARNING;
      } else if (revReadyCondition && revReadyCondition.reason === 'Deploying') {
        return STATE_DEPLOYING;
      }
    }

    return STATE_FAILED;
  } else if (application.status === UIEntityStatus.DEPLOYING) {
    return STATE_DEPLOYING;
  } else if (application.status === UIEntityStatus.UNKNOWN) {

    // check whether the application contains has revisions
    if (!application.revision || !application.revision.statusConditions) {
      // if it has no revisions, it is a strong indicator that a deployment is ongoing
      return STATE_DEPLOYING;
    }

    // check the status condition 'Ready' of the latest revision
    const revReadyCondition = getReadyCondition(application.revision.statusConditions);
    if (!revReadyCondition) {
      return STATE_DEPLOYING;
    }

    if (revReadyCondition.reason === 'Deploying') {
      return STATE_DEPLOYING;
    }

    // in case we don't know, return unknown
    return STATE_WARNING;
  }

  return STATE_WARNING;
}

function getRevisionState(revision: appModel.IUIApplicationRevision) {
  let state = STATE_WARNING;

  if (revision.status === UIEntityStatus.READY) {
    state = STATE_READY;
  } else if (revision.status === UIEntityStatus.FAILED) {
    state = STATE_FAILED;
  } else if (revision.status === UIEntityStatus.UNKNOWN) {
    state = STATE_WARNING;
  } else if (revision.status === UIEntityStatus.DEPLOYING) {
    state = STATE_DEPLOYING;
  }

  return state;
}

function getState(appOrRevision: appModel.IUIApplication | appModel.IUIApplicationRevision) {
  return (appOrRevision.kind === UIEntityKinds.APPLICATION) ? getAppState(appOrRevision as appModel.IUIApplication) : getRevisionState(appOrRevision as appModel.IUIApplicationRevision);
}

function getDeploymentType(app: appModel.IUIApplication) {

  // if there is no revision defined in the service, we assume it is a fresh deployment
  if (!app.latestCreatedRevisionName) {
    return 'app';
  }

  // check whether a ingress uzpdate is pending
  const appReadyCondition = getReadyCondition(app.statusConditions);
  if (appReadyCondition) {
    if (appReadyCondition.reason === 'IngressNotConfigured') {
      return 'config';
    } else if (appReadyCondition.reason === 'OutOfDate') {
      return 'rev';
    }
  }

  // check whether a revision update is ongoing
  if (app.revision) {
    // check the status condition 'Ready' of the latest revision
    const revReadyCondition = getReadyCondition(app.revision.statusConditions);
    if (revReadyCondition) {
      if (revReadyCondition.reason === 'Deploying' || revReadyCondition.reason === 'OutOfDate') {
        return 'rev';
      }
    }
  }

  return '';
}

function getWarningType(app: appModel.IUIApplication) {

  // check the status condition 'Ready' of the latest revision
  const revReadyCondition = getReadyCondition(app.revision.statusConditions);
  if (revReadyCondition) {
    if (revReadyCondition.status === 'False') {
      return 'rev';
    }
  }

  return '';
}

const render = (appOrRevision: appModel.IUIApplication | appModel.IUIApplicationRevision) => {
  const state = getState(appOrRevision);
  logger.debug(`render - appOrRevision: ${appModel.stringify(appOrRevision)} - detected state: ${state}`);
  let iconToRender;

  if (state === STATE_READY) {
    iconToRender = <CheckmarkFilled16 className='fill-success' />;
  } else if (state === STATE_WARNING) {
    iconToRender = <WarningFilled16 className='fill-warning' />;
  } else if (state === STATE_FAILED) {
    iconToRender = <ErrorFilled16 className='fill-failed' />;
  } else if (state === STATE_DEPLOYING) {
    iconToRender = <InlineLoading />;
  }

  return (
    <React.Fragment>
      <div className={`clg-item--status ${state}`}>
        <div className='clg-item--status-icon'>{iconToRender}</div>
        <div className='bx--type-caption clg-item--status-caption'>{value(appOrRevision)}</div>
      </div>
    </React.Fragment>
  );
};

const value = (appOrRevision: appModel.IUIApplication | appModel.IUIApplicationRevision) => {

  const state = getState(appOrRevision);
  logger.debug(`value - appOrRevision: ${appModel.stringify(appOrRevision)} - detected state: ${state}`);

  let stateSuffix = '';
  if (state === STATE_DEPLOYING) {
    if (appOrRevision.kind === UIEntityKinds.APPLICATION) {
      stateSuffix = getDeploymentType(appOrRevision as appModel.IUIApplication);
    }
  } else if (state === STATE_WARNING) {
    if (appOrRevision.kind === UIEntityKinds.APPLICATION) {
      stateSuffix = getWarningType(appOrRevision as appModel.IUIApplication);
    }
  } else if (state === STATE_FAILED) {
    if (appOrRevision.kind !== UIEntityKinds.APPLICATION) {
      stateSuffix = 'rev';
    }
  }

  return t(`clg.application.state.${stateSuffix}${state}`);
};

const rawValue = (item) => (
  getState(item)
);

export default { rawValue, render, value };
