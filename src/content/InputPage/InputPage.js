import React from "react";
import { Tile } from "carbon-components-react";

import QInput from "../../components/QInput/QInput";
import { Memory, vCPU } from "../../components/QInput/units";

class InputPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      RAM1: "",
      MEMORY1: "",
      CPU1: "",
    };
    this.onChange = this.onChange.bind(this);
  }

  onChange(ID, VALUE) {
    if (ID === "RAM") {
      this.setState({ RAM1: VALUE });
    }
    if (ID === "MEMORY") {
      this.setState({ MEMORY1: VALUE });
    }
    if (ID === "CPU") {
      this.setState({ CPU1: VALUE });
    }
  }

  render() {
    return (
      <div>
        <div
          style={{
            position: "absolute",
            left: "23%",
            top: "20%",
          }}
        >
          <h1 style={{ fontSize: "70px", marginBottom: "20px" }}>Input</h1>

          <label>
            RAM
            <QInput
              unitConfig={Memory}
              minVal={"10 MiB"}
              maxVal={"100 TiB"}
              onUpdate={this.onChange.bind(this, "RAM")}
              value={this.state.RAM1}
              defaultUnit={2}
            />
          </label>

          <label>
            CPU
            <QInput
              unitConfig={vCPU}
              minVal={"100 m"}
              maxVal={"100 vCPU"}
              onUpdate={this.onChange.bind(this, "CPU")}
              value={this.state.MEMORY1}
              defaultUnit={0}
            />
          </label>
        </div>

        <div
          style={{
            position: "absolute",
            right: "23%",
            top: "20%",
          }}
        >
          <h1 style={{ fontSize: "70px", marginBottom: "20px" }}>Output</h1>
          <label>
            RAM
            <Tile style={{ marginBottom: "26px" }}> {this.state.RAM1}</Tile>
          </label>

          <label>
            CPU
            <Tile> {this.state.CPU1} </Tile>
          </label>
        </div>
      </div>
    );
  }
}
export default InputPage;
