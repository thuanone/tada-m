import React from 'react';

// coligo
import { IUIKeyValue } from '../../../common/model/config-model';

const getDisplayValue = (item: IUIKeyValue): string => {
    return item.value;
};

const render = (item: IUIKeyValue, revealSecret?: boolean) => {
    let val = getDisplayValue(item);

    if (!revealSecret) {
        val = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';
        return <div><span className='bx--type-caption' key={`label_${val}`}>{val}</span></div>;
    } else {
        val = atob(val);
        return <div><span className='bx--type-caption' key={`label_${val}`}>{val}</span></div>;
    }
};

const value = (item: IUIKeyValue, revealSecret?: boolean) => {
    let val = getDisplayValue(item);

    if (!revealSecret) {
        val = '********';
    }

    return val;
};

export default { render, value };
