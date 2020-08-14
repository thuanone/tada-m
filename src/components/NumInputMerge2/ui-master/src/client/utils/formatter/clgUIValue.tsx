import React from 'react';

// coligo
import { IUIKeyValue } from '../../../common/model/config-model';

const getDisplayValue = (item: IUIKeyValue): string => {
    return item.value;
};

const render = (item: IUIKeyValue) => {
    const val = getDisplayValue(item);

    return <div><span className='bx--type-caption' key={`label_${val}`}>{val}</span></div>;
};

const value = (item: IUIKeyValue) => {
    return getDisplayValue(item);
};

export default { render, value };
