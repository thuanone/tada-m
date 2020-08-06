import React from 'react';
import NumInputMerge1 from '../../components/NumInputMerge1/NumInputMerge1'


const Memory_Unit= {
    value: 0,
    unitList:['MB','GB'],
    minVal: 0,
    maxVal: 10,
    standardStepSizes:[1,0.25],
    standardChunks:[128, 0.5],
    unitInUsePTR: 0,
    allowMultipleUnits: false,
    conversionToBiggerSize: [1024,1]

} 

const PageM1 = () => {
    return(
        <div>
            <h1>PageM1</h1>

            <label>
                NumberInput Merge
                <NumInputMerge1 
                    {...Memory_Unit}
                />
            </label>

        
        </div>
    );
}

export default PageM1;