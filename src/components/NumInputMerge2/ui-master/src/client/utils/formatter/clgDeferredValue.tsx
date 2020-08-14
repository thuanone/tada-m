import React from 'react';

import { SkeletonText } from '@console/pal/carbon-components-react';

const render = (valueToShow: string | number, widthToUse?: number) => {
    if (!valueToShow && valueToShow !== 0) {
        const width = (!widthToUse || isNaN(widthToUse) || widthToUse > 100 || widthToUse < 1) ? '100%' : `${widthToUse}%`;
        return <SkeletonText width={width} />;
    } else {
        return <span>{valueToShow}</span>;
    }
};

const value = (valueToShow: string) => {
    return valueToShow || '';
};

export default { render, value };
