import React from "react";
import QInput from "../../components/QInput/QInput";

import  {Memory as MemoryUnit} from "../../components/QInput/units";
import {vCPU} from "../../components/QInput/units";

class QInputPage extends React.Component {
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
      <div style={{
        position: 'absolute', left: '50%', top: '30%',
        transform: 'translate(-50%, -50%)'}}>
        <h1 style={{fontSize:'70px', marginBottom: '20px'}}>QInput</h1>

        <label>
            
            <QInput unitConfig={vCPU} onUpdate={this.onChange} value={this.state.value}/>
        </label>

        <div class="bx--form__helper-text">
          Output: {this.state.value}
        </div>

      </div>
    );
  }
};

export default QInputPage;
