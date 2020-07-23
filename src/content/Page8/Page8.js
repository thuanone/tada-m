import React from 'react';
import NumInputForm4 from '../../components/NumInputThuan4/NumInput4';
import {NumberInput, TextInput} from "carbon-components-react";

const CPU_Unit= {
    unitAssociated:['m','CPU'],
    value: 0,
    minVal: 0,
    maxVal: 10,
    stepSize:[0.25,0.5,1,],
    nextUnitIncrement:[0.25,0.50,0.75,1.0,1.25,1.5],
    uppedUnits: false,
} 

const Page8 = () => {
    return(
        <div>
            <h1>Page8</h1>
            <label>
                NumInput4 mit CPUUnit
                <NumInputForm4 
                    {...CPU_Unit}
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