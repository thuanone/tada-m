import React from "react";
import NumInputMerge1 from "../../components/NumInputMerge1/NumInputMerge1";
import NumInputMerge2 from "../../components/NumInputMerge2/NumInputMerge2";

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

class PageM1 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '', 
    };

    this.onChange = this.onChange.bind(this);
  }

  onChange(newValue) {

    this.setState({value: newValue});
  };

  render() {
    return (   
      <div>
        <h1>PageM1</h1>

        <label>
          NumberInput Merge
          <NumInputMerge1 {...Memory_Units} />
        </label>
        <label>
            NumberInputMerge 2
            <NumInputMerge2  onUpdate={this.onChange} value={this.state.value}/>
        </label>

        <label>
          Output: {this.state.value}
        </label>
      </div>
    );
  }
};

export default PageM1;
