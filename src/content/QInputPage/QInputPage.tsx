import React from "react";
import QInput from "../../components/QInput/QInput";

import { Memory_1, vCPU } from "../../components/QInput/units";

class QInputPage extends React.Component <{}, { value: string }> {
  constructor(props) {
    super(props);
    this.state = {
      value: "",
    };

    this.onChange = this.onChange.bind(this);
  }

  onChange(newValue: any) {
    this.setState({ value: newValue });
  }

  render() {
    return (
      <div
        style={{
          position: "absolute",
          left: "46%",
          top: "33%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <h1 style={{ fontSize: "70px", marginBottom: "20px" }}>QInput</h1>

        <label>
          <QInput onUpdate={this.onChange} value={this.state.value} />
        </label>

        <div className="bx--form__helper-text">Output: {this.state.value}</div>
      </div>
    );
  }
}

export default QInputPage;
