import React from "react";
import { Tile } from "carbon-components-react";

import QInput from "../../components/QInput/QInput";
import { Memory_1, vCPU, Time, Memory_2 } from "../../components/QInput/units";

class InputPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      RAM1: "",
      MEMORY1: "",
      MEMORY2: "",
      CPU1: "",
      TIME1: "",
    };
    this.onChange = this.onChange.bind(this);
  }

  onChange(ID, VALUE) {
    if (ID === "RAM") {
      this.setState({ RAM1: VALUE });
    }
    if (ID === "MEMORY1") {
      this.setState({ MEMORY1: VALUE });
    }
    if (ID === "MEMORY2") {
      this.setState({ MEMORY2: VALUE });
    }
    if (ID === "CPU") {
      this.setState({ CPU1: VALUE });
    }
    if (ID === "TIME") {
      this.setState({ TIME1: VALUE });
    }
  }

  render() {
    return (
      <div>
        <div
          style={{
            position: "absolute",
            left: "23%",
            top: "15%",
          }}
        >
          <h1 style={{ fontSize: "70px", marginBottom: "20px" }}>Input</h1>

          <label>
            RAM
            <QInput
              unitConfig={Memory_1}
              minVal={"1 MiB"}
              maxVal={"100 TiB"}
              placeholder="e.g. 1 MiB"
              onUpdate={this.onChange.bind(this, "RAM")}
              value={this.state.RAM1}
              defaultUnit={1}
            />
          </label>

          <label>
            CPU
            <QInput
              unitConfig={vCPU}
              minVal={"100 m"}
              maxVal={"100 vCPU"}
              placeholder="e.g. 100 m"
              onUpdate={this.onChange.bind(this, "CPU")}
              value={this.state.MEMORY1}
              defaultUnit={1}
            />
          </label>

          <label>
            Time
            <QInput
              unitConfig={Time}
              minVal={"0 s"}
              maxVal={"10 year"}
              placeholder="e.g. 1s"
              onUpdate={this.onChange.bind(this, "TIME")}
              value={this.state.TIME}
              defaultUnit={0}
            />
          </label>
          <label>
            Memory 2
            <QInput
              unitConfig={Memory_2}
              minVal={"1 MB"}
              maxVal={"100 TB"}
              placeholder="e.g. 1 MB"
              onUpdate={this.onChange.bind(this, "MEMORY2")}
              value={this.state.MEMORY2}
              defaultUnit={2}
            />
          </label>
        </div>

        <div
          style={{
            position: "absolute",
            right: "23%",
            top: "15%",
          }}
        >
          <h1 style={{ fontSize: "70px", marginBottom: "20px" }}>Output</h1>
          <label>
            RAM
            <Tile style={{ marginBottom: "26px" }}> {this.state.RAM1}</Tile>
          </label>

          <label>
            CPU
            <Tile style={{ marginBottom: "26px" }}> {this.state.CPU1} </Tile>
          </label>

          <label>
            Time
            <Tile style={{ marginBottom: "26px" }}> {this.state.TIME1} </Tile>
          </label>
          <label>
            Memory 2<Tile> {this.state.MEMORY2} </Tile>
          </label>
        </div>
      </div>
    );
  }
}
export default InputPage;
