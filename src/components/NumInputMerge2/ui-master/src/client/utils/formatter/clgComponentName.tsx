import React from 'react';

// carbon + pal
import { Code24, ListChecked24, Task24 } from '@carbon/icons-react';

// coligo
import { UIEntityKinds } from '../../../common/model/common-model';

const render = (item) => {

    const kind = item && item.kind;
    const name = item && item.name;

    // build iconElem based on item type
    let iconElem;
    if (kind === UIEntityKinds.JOBDEFINITION) {
        iconElem = <ListChecked24 className='clg-item--icon' key={`icon_${name}`} />;
    } else if (kind === UIEntityKinds.APPLICATION) {
        iconElem = <Code24 className='clg-item--icon' key={`icon_${name}`} />;
    } else if (kind === UIEntityKinds.JOBRUNINSTANCE || kind === UIEntityKinds.JOBRUN) {
        iconElem = <Task24 className='clg-item--icon' key={`icon_${name}`} />;
    }

    return <div>{iconElem}<span className='bx--type-caption clg-item--caption' key={`label_${name}`}>{name}</span></div>;
};

const value = (item) => {
    return item && item.name;
};

export default { render, value };
