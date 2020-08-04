import React from 'react';
import './PageM.scss';
import NumInputMerge1 from '../../components/NumInputMerge1/NumInputMerge1';


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

const PageM = () => {
    return(
        <div>

            <h1>PageM</h1>

            <label>
                NumInput Merge
            </label>

            <NumInputMerge1 
                {...Memory_Unit}
            />
            
        </div>
    );
}

export default PageM;