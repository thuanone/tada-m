// react
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import {
  CheckmarkFilled16,
} from '@carbon/icons-react';
import {
  InlineLoading,
} from '@console/pal/carbon-components-react';

// coligo
import * as projectModel from '../../../common/model/project-model';
import t from '../i18n';

const COMPONENT = 'utils:formatter:tenantstatus';
const logger = log.getLogger(COMPONENT);

const STATE_READY = 'ready';
const STATE_DEPLOYING = 'deploying';

function getState(projectStatus: projectModel.IUIProjectStatus) {
  return (projectStatus && projectStatus.domain && projectStatus.tenant) ? STATE_READY : STATE_DEPLOYING;
}

const render = (projectStatus: projectModel.IUIProjectStatus) => {
  const state = getState(projectStatus);
  logger.debug(`render - projectStatus: ${JSON.stringify(projectStatus)} - detected state: ${state}`);
  let iconToRender;

  if (state === STATE_READY) {
    iconToRender = <CheckmarkFilled16 className='fill-success' />;
  } else if (state === STATE_DEPLOYING) {
    iconToRender = <InlineLoading />;
  }

  return (
    <div>
      {state === STATE_DEPLOYING &&
        (
          <div className={`clg-item--status ${state}`}>
            <div className='clg-item--status-icon'>{iconToRender}</div>
            <div className='bx--type-caption clg-item--status-caption'>{value(projectStatus)}</div>
          </div>
        )
      }
    </div>
  );
};

const value = (projectStatus: projectModel.IUIProjectStatus) => {

  const state = getState(projectStatus);
  logger.debug(`value - projectStatus: ${JSON.stringify(projectStatus)} - detected state: ${state}`);

  return t(`clg.project.state.tenant.${state}`);
};

const rawValue = (item) => (
  getState(item)
);

export default { rawValue, render, value };
