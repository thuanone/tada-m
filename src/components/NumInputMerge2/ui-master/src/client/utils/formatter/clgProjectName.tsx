import React from 'react';

import {
  ErrorFilled16,
  WarningFilled16,
} from '@carbon/icons-react';

import * as projectModel from '../../../common/model/project-model';

const STATE_OK = 'ok';
const STATE_WARN = 'warning';
const STATE_URGENT = 'urgent';

const HOURS = 60 * 60 * 1000;
const warnWindow = 48 * HOURS; // 48 hours
const urgentWindow = 24 * HOURS; // 24 hours

const getExpiryState = (project: projectModel.IUIProject) => {

  if (!project.projectStatus || !project.projectStatus.expireTimestamp) {
    return STATE_OK;
  }

  const expireTimestamp = project.projectStatus.expireTimestamp;
  const now = Date.now();
  if (expireTimestamp - now <= urgentWindow) {
    return STATE_URGENT;
  }

  if (expireTimestamp - now <= warnWindow) {
    return STATE_WARN;
  }

  return STATE_OK;
};

const render = (project: projectModel.IUIProject) => {
  const state = getExpiryState(project);

  if (state === STATE_OK) {
    return <span>{value(project)}</span>;
  }

  let iconToRender;
  if (state === STATE_WARN) {
    iconToRender = <WarningFilled16 className='fill-warning' />;
  } else if (state === STATE_URGENT) {
    iconToRender = <WarningFilled16 className='fill-warning' />;
  }

  return (
    <div className={`clg-item--status ${state}`}>
      <div className='clg-item--status-icon'>{iconToRender}</div>
      <div className='bx--type-caption clg-item--status-caption'>{value(project)}</div>
    </div>
  );
};

const value = (project: projectModel.IUIProject) => (
  project && project.name
);

export default {
  getExpiryState,
  render,
  states: {
    STATE_OK,
    STATE_URGENT,
    STATE_WARN,
  },
  value,
};
