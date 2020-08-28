import React from "react";
import { Tile } from "carbon-components-react";

import QInput from "../../components/QInput/QInput";
import { Memory as MemoryUnit } from "../../components/QInput/units";

class InputPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      RAM1: "",
      MEMORY1: "",
    };
    this.onChange = this.onChange.bind(this);
  }

  onChange(arg1, arg2) {
    if (arg1 === "RAM") {
      this.setState({ RAM1: arg2 });
    }
    if (arg1 === "MEMORY") {
      this.setState({ MEMORY1: arg2 });
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
              unitConfig={MemoryUnit}
              onUpdate={this.onChange.bind(this, "RAM")}
              value={this.state.RAM1}
            />
          </label>

          <label>
            Memory
            <QInput
              unitConfig={MemoryUnit}
              onUpdate={this.onChange.bind(this, "MEMORY")}
              value={this.state.MEMORY1}
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
            <Tile style={{ marginBottom: "26px" }}>
              {" "}
              {this.state.RAM1} 
            </Tile>
          </label>

          <label>
            Memory
            <Tile> {this.state.MEMORY1} </Tile>
          </label>
        </div>
      </div>
    );
  }
}
export default InputPage;
