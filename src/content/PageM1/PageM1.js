import React from 'react';
import NumInputMerge1 from '../../components/NumInputMerge1/NumInputMerge1'


const Memory_Units = [{
    unit: 'MB',
    minVal: 0,
    maxVal: 10,
    standardStepSize: 1,
    standardChunk: 128,
    allowMultipleUnits: false,
    conversionToBiggerSize: 1024
  },
  {
    unit: 'GB',
    minVal: 0,
    maxVal: 10,
    standardStepSize: 0.25,
    standardChunk: 0.5,
    allowMultipleUnits: false,
    conversionToBiggerSize: 1024
  }]

const PageM1 = () => {
    return(
        <div>
            <h1>PageM1</h1>

            <label>
                NumberInput Merge
                <NumInputMerge1 
                    {...Memory_Units}
                />
            </label>

        
        </div>
    );
}

export default PageM1;