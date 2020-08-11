import React from 'react';
import NumInputMerge1 from '../../components/NumInputMerge1/NumInputMerge1'


const Memory_Units = {
    general : {
        // base config
        convertUnit : 1024,
        minVal : 0,
        // maxVal : ?,
    },
    unitConfig:[
        
        {
            unit: 'MiB',
            shortUnit: 'MI',
            standardStepSize: 1,
            standardChunk: 128,
            allowMultipleUnits: false,
        },
        {
            unit: 'GiB',
            shortUnit: 'Gi',
            standardStepSize: 0.25,
            standardChunk: 0.5,
            allowMultipleUnits: false,
        },
        {
            unit: 'TiB',
            shortUnit: 'Ti',
            standardStepSize: 0.1,
            standardChunk: 0.5,
            allowMultipleUnits: false,
        },
    ]
}


const PageM1 = () => {
    return(
        <div>
            <h1>PageM1</h1>

            <label>
                NumberInput Merge
                <NumInputMerge1 
                    {...Memory_Units}
                />
            </label>

        
        </div>
    );
}

export default PageM1;