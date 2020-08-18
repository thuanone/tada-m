import React from 'react';
import NumInputMerge from '../../components/NumInputMerge/NumInputMerge'


const Memory_Unit= {
    value: 0,
    unitList:['mb','gb'],
    minVal: 0,
    maxVal: 10,
    standardStepSizes:[1,0.25],
    standardChunks:[128, 0.5],
    unitInUsePTR: 0,
    allowMultipleUnits: false,
    conversionToBiggerSize: [1024,1]

} 

const PageM = () => {
    return(
        <div>
            <h1>PageM Base</h1>

            <label>
                NumberInput Merge
                <NumInputMerge 
                    {...Memory_Unit}
                />
            </label>

        
        </div>
    );
}

export default PageM;