import React from 'react';

import * as appModel from '../../../common/model/application-model';

export function render(revision: appModel.IUIApplicationRevision, trafficTargets: appModel.IUIApplicationTrafficTargets) {
  if (!revision || !revision.name) {
    return <span>-</span>;
  }
  return <span className={`rev_${revision.name}_traffic-percentage`}>{value(revision, trafficTargets)}</span>;
}

export function value(revision: appModel.IUIApplicationRevision, trafficTargets: appModel.IUIApplicationTrafficTargets) {
  return ((trafficTargets && trafficTargets[revision.name]) ? `${trafficTargets[revision.name]}%` : '-');
}
