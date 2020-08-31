import React from "react";
import QInput from "../../components/QInput/QInput";

import  {Memory, vCPU} from "../../components/QInput/units";

class QInputPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: "", 
    };

    this.onChange = this.onChange.bind(this);
  }

  onChange(newValue) {

    this.setState({value: newValue});
  };

  render() {
    return (   
      <div style={{
        position: 'absolute', left: '46%', top: '33%',
        transform: 'translate(-50%, -50%)'}}>
        <h1 style={{fontSize:'70px', marginBottom: '20px'}}>QInput</h1>

        <label>
            
        <QInput unitConfig={vCPU} 
        minVal={"100 m"} 
        maxVal={"100 vCPU"} 
        unitConfigInUse={"vCPU"} 
        onUpdate={this.onChange} 
        value={this.state.value}
        defaultUnit = {0}/>
        </label>

        <div class="bx--form__helper-text">
          Output: {this.state.value}
        </div>

      </div>
    );
  }
};

export default QInputPage;
