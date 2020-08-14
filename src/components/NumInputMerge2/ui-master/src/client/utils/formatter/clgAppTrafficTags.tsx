import React from 'react';

import { Tag } from '@console/pal/Components';

import * as appModel from '../../../common/model/application-model';

export function render(revision: appModel.IUIApplicationRevision, routingTags: appModel.IUIApplicationRoutingTags) {
  if (!revision || !revision.name) {
    return <span>-</span>;
  }

  const tags = routingTags && routingTags[revision.name];

  // check if this revision has some tags
  if (tags && tags.length > 0) {
    const allTags = [];
    for (const tag of tags) {
      allTags.push(<Tag type='gray' key={`rev_${revision.name}_traffic-tag__${tag}`}>{tag}</Tag>);
    }
    return <span className={`rev_${revision.name}_traffic-tags`}>{allTags}</span>;
  }

  return <span>-</span>;
}

export function value(revision: appModel.IUIApplicationRevision, routingTags: appModel.IUIApplicationRoutingTags) {
  let tagStr = '';

  const tags = routingTags && routingTags[revision.name];

  // check if this revision has some tags
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      tagStr += ` ${tag}`;
    }
  }
  return tagStr.trim();
}
