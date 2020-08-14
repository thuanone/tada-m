import React from 'react';

// coligo
import { IUIKeyValue } from '../../../common/model/config-model';

const getDisplayKey = (item: IUIKeyValue): string => {
    return item.key;
};

const render = (item: IUIKeyValue, revealSecret?: boolean) => {
    const key = getDisplayKey(item);

    return <div><span className='bx--type-caption' key={`label_${key}`}>{key}</span></div>;
};

const value = (item: IUIKeyValue, revealSecret?: boolean) => {
    return getDisplayKey(item);
};

export default { render, value };
