import React from 'react';
import NumInputForm5 from '../../components/NumInputThuan5/NumInput5';
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

} 

const Page10 = () => {
    return(
        <div>
            <h1>Page10</h1>
            <label>
                NumInput4 mit CPUUnit
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

export default Page10;