import React from "react";
import QInput from "../../components/QInput/QInput";

import  {Memory as MemoryUnit} from "../../components/QInput/units";
const Memory = [
  /*
  {
    unit: "Byte",
    shortUnit: "byte",
    standardStepSize: 1,
    standardChunk: 128,
    convertUpAt: 1024,
  },
  {
    unit: "KiB",
    shortUnit: "Ki",
    standardStepSize: 1,
    standardChunk: 128,
    convertUpAt: 1024,
  },
  */
  {
    unit: "MiB",
    shortUnit: "Mi",
    standardStepSize: 1,
    standardChunk: 128,
    convertUpAt: 1024,
  },
  {
    unit: "GiB",
    shortUnit: "Gi",
    standardStepSize: 0.25,
    standardChunk: 0.5,
    convertUpAt: 1024,
  },
  {
    unit: "TiB",
    shortUnit: "Ti",
    standardStepSize: 0.1,
    standardChunk: 0.5,
    convertUpAt: 1024,
  },
];

const Memory_Units = {
  general: {
    // base config
    convertUnit: 1024,
    minVal: 0,
    // maxVal : ?,
  },
  unitConfig: [
    {
      unit: "MiB",
      shortUnit: "MI",
      standardStepSize: 1,
      standardChunk: 128,
      allowMultipleUnits: false,
    },
    {
      unit: "GiB",
      shortUnit: "Gi",
      standardStepSize: 0.25,
      standardChunk: 0.5,
      allowMultipleUnits: false,
    },
    {
      unit: "TiB",
      shortUnit: "Ti",
      standardStepSize: 0.1,
      standardChunk: 0.5,
      allowMultipleUnits: false,
    },
  ],
};

class QInputPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '', 
    };

    this.onChange = this.onChange.bind(this);
  }

  onChange(newValue) {
    console.log(MemoryUnit);
    this.setState({value: newValue});
  };

  render() {
    return (   
      <div style={{
        position: 'absolute', left: '50%', top: '30%',
        transform: 'translate(-50%, -50%)'}}>
        <h1>QInput</h1>

        <label>
            
            <QInput unitConfig={MemoryUnit} onUpdate={this.onChange} value={this.state.value}/>
        </label>

        <div class="bx--form__helper-text">
          Output: {this.state.value}
        </div>

      </div>
    );
  }
};

export default QInputPage;
