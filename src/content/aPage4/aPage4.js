import React from 'react';
import NumInputForm2 from '../../components/NumInputThuan2/NumInput2';

const CPU_Unit= {
    unitAssociated:['m','CPU'],
    value: 0,
    minVal: 0,
    maxVal: 10,
    stepSize:[0.25,0.5,1,],
    nextUnitIncrement:[0.25,0.50,0.75,1.0,1.25,1.5],
    uppedUnits: false,
} 

const Page4 = () => {
    return(
        <div>
            <h1>Page4</h1>
            <label>
                NumInput2 mit CPUUnit
                <NumInputForm2 
                    {...CPU_Unit}
                />
            </label>
            <br/>
            <label>
                NumInput2 Vanilla
                <NumInputForm2
                
                />
            </label>
        </div>
    );
}

export default Page4;