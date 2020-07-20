import React from 'react';
import NumInputForm from '../../components/NumInputThuan/NumInput'

const Page2 = () => {
    return(
        <div>
            <h1>Thuans NumInput</h1>
            <NumInputForm 
                unitAssociated={['m','CPU']}
                value = {0}
                minVal = {0}
                maxVal= {10}
                stepSize= {[0.25,0.5,1,]}
                nextUnitIncrement= {[0.25,0.50,0.75,1.0,1.25,1.5]}
                uppedUnits= {false}
            />
        </div>
    );
}

export default Page2;