import React from 'react';
import { Link } from 'react-router-dom';

// coligo
import { IUIJobRun } from '../../../common/model/job-model';
import nav from '../nav';

function getDefinitionUrl(jobRun: IUIJobRun) {
    return nav.toJobDefinitionDetail(jobRun.regionId, jobRun.projectId, jobRun.definitionName);
}

const render = (item) => {
    const jobRun = (item as IUIJobRun);
    const definitionUrl = getDefinitionUrl(jobRun);
    let labelElem;

    if (item.definitionName) {
        if (definitionUrl) {
            labelElem = <Link className='bx--type-caption' to={definitionUrl}>{jobRun.definitionName}</Link>;
        } else {
            // just render the definitionName, yet not as a clickable URL
            labelElem = <span className='bx--type-caption'>{item.definitionName}</span>;
        }
    } else {
        labelElem = <span className='bx--type-caption'>-</span>;
    }

    return <div>{labelElem}</div>;
};

const value = (item) => {
    return getDefinitionUrl(item);
};

export default { render, value };
