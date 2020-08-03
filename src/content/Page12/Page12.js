import React from 'react';
import NumInputForm5 from '../../components/NumInputThuan6/NumInput6';
import {NumberInput, TextInput} from "carbon-components-react";

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

const Page12 = () => {
    return(
        <div>
            <h1>Page12</h1>
            <label>
                NumInput5 mit CPUUnit
                <NumInputForm5 
                    {...Memory_Unit}
                />
            </label>
            <hr />
            <label>
                CarbonNumberInput
                <NumberInput />
            </label>
            <br/>
            <label>
                CarbonTextInput
                <TextInput />
            </label>
        </div>
    );
}

export default Page12;