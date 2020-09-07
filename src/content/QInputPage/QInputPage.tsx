import React from "react";
import QInput from "../../components/QInput/QInput";

import { Memory_1, vCPU } from "../../components/QInput/units";

type NumberOrString = number | string

interface onPopulate{
  value: NumberOrString,
  message: string,
  valid: boolean,
}

class QInputPage extends React.Component<{}, { RAM1: string }> {
  constructor(props) {
    super(props);
    this.state = {
      RAM1: "",
    };

    this.onChange = this.onChange.bind(this);
  }

  onChange(populate: onPopulate) {
    this.setState({ RAM1: `Value: ${populate.value} Message: ${populate.message} Valid: ${populate.valid}` });
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
          <QInput unitConfig={Memory_1}
            minVal={"1 MiB"}
            maxVal={"100 TiB"}
            placeholder="e.g. 1 MiB"
            onUpdate={this.onChange}
            value={this.state.RAM1}
            defaultUnit={2}
          />
        </label>

        <div className="bx--form__helper-text">Output: {this.state.RAM1}</div>
      </div>
    );
  }
}

export default QInputPage;
