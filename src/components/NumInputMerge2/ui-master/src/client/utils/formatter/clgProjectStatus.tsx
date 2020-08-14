import React from 'react';

import {
  CheckmarkFilled16,
  ErrorFilled16,
  Restart16,
} from '@carbon/icons-react';
import {
  InlineLoading,
} from '@console/pal/carbon-components-react';

import * as projectModel from '../../../common/model/project-model';
import t from '../i18n';
import clgDeferredValue from './clgDeferredValue';

const STATE_ACTIVE = 'active';
const STATE_REMOVED = 'removed';
const STATE_PROVISIONING = 'provisioning';
const STATE_DEPROVISIONING = 'deleting';

function getState(project: projectModel.IUIProject) {
  let state = STATE_DEPROVISIONING;

  if (project.state === projectModel.UIResourceInstanceStatus.ACTIVE) {
    state = STATE_ACTIVE;

    // case active could also mean that the domain is not ready yet
    if (project.projectStatus && !project.projectStatus.domain) {
      state = STATE_PROVISIONING;
    }
  } else if (project.state === projectModel.UIResourceInstanceStatus.REMOVED) {
    state = STATE_REMOVED;
  } else if (project.state === projectModel.UIResourceInstanceStatus.PROVISIONING) {
    state = STATE_PROVISIONING;
  }

  return state;
}

const render = (project: projectModel.IUIProject) => {

  const state = getState(project);

  // in case the project status has not been loaded yet, show a skeleton text
  // this does not apply of the project is in state provisioning or deleting
  if (project && !project.projectStatus && ((state !== STATE_PROVISIONING) && (state !== STATE_DEPROVISIONING))) {
    return clgDeferredValue.render(undefined, 50);
  }

  if (project.isDeleting &&
    !(state === STATE_DEPROVISIONING)) {
    const iconToRender = <InlineLoading />;
    return (
      <div className={`clg-item--status ${state} loading`}>
        <div className='clg-item--status-icon'>{iconToRender}</div>
        <div className='bx--type-caption clg-item--status-caption'>{t('clg.common.label.deleting')}</div>
      </div>
    );
  } else {
    let iconToRender;
    if (state === STATE_ACTIVE) {
      iconToRender = <CheckmarkFilled16 className='fill-success' />;
    } else if ((state === STATE_PROVISIONING) ||
      (state === STATE_DEPROVISIONING)) {
      iconToRender = <InlineLoading />;
    } else if (state === STATE_REMOVED) {
      iconToRender = <ErrorFilled16 className='fill-failed' />;
    }
    return (
      <div className={`clg-item--status ${state}`}>
        <div className='clg-item--status-icon'>{iconToRender}</div>
        <div className='bx--type-caption clg-item--status-caption'>{t(`clg.project.state.${state}`)}</div>
      </div>
    );
  }
};

const value = (item) => (
  t(`clg.project.state.${getState(item)}`)
);

const rawValue = (item) => (
  getState(item)
);

const isDeleting = (item) => (
  STATE_DEPROVISIONING === rawValue(item)
);

export default { isDeleting, rawValue, render, value };
