import React from 'react';
import NumInputForm4 from '../../components/NumInputThuan4/NumInput4';
import {NumberInput, TextInput} from "carbon-components-react";

const Memory_Unit= {
    unitAssociated:['mb','gb'],
    value: 0,
    minVal: 0,
    maxVal: 10,
    standardStepSizes:[1,0.25],
    standardChunks:[128, 0.5],
    unitInUse: 0,

} 

const Page8 = () => {
    return(
        <div>
            <h1>Page8</h1>
            <label>
                NumInput4 mit CPUUnit
                <NumInputForm4 
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

export default Page8;