import React from 'react';

import {
  TooltipDefinition,
} from '@console/pal/carbon-components-react';

import * as appModel from '../../../common/model/application-model';
import t from '../i18n';

function getNumberOfRunningInstances(instances: appModel.IUIApplicationInstance[]): number {
  return (instances && Array.isArray(instances)) ? instances.length : 0;
}

function render(instances: appModel.IUIApplicationInstance[]) {
  return (
    <span className='bx--type-caption clg-item--caption resource-status--instances'>
      <TooltipDefinition triggerClassName={'clg-tooltip-definition'} tooltipText={t('clg.application.runningInstances.tooltip')}>{value(instances)}</TooltipDefinition>
    </span>
  );
}

function value(instances: appModel.IUIApplicationInstance[]): string {
  const numberOfInstances = getNumberOfRunningInstances(instances);
  if (numberOfInstances === 1) {
    return t('clg.application.runningInstance', { number: `${numberOfInstances}` });
  } else {
    return t('clg.application.runningInstances', { number: `${numberOfInstances}` });
  }
}

function rawValue(instances: appModel.IUIApplicationInstance[]): number {
  return getNumberOfRunningInstances(instances);
}

export default { rawValue, render, value };
