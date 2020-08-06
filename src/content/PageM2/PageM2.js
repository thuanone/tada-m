import React from 'react';
import NumInputMerge2 from '../../components/NumInputMerge2/NumInputMerge2'


const Memory_Unit= {
    value: 0,
    unitAssociated:['mb','gb'],
    minVal: 0,
    maxVal: 10,
    standardStepSizes:[1,0.25],
    standardChunks:[128, 0.5],
    unitInUsePTR: 0,
    allowMultipleUnits: false,
    conversionToBiggerSize: [1024,1]

} 

const PageM2 = () => {
    return(
        <div>
            <h1>PageM</h1>

            <label>
                NumberInput Merge
                <NumInputMerge2 
                    {...Memory_Unit}
                />
            </label>

        
        </div>
    );
}

export default PageM2;