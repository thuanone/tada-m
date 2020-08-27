import React from "react";
import "./Page5.scss";
import { Tile } from "carbon-components-react";

class Page5 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: true,
    };

    this.send = this.send.bind(this);
  }

  send(arg1) {
    this.setState({ name: arg1 });
  }

  render() {
    return (
      <div className="div1">
        <Tile>{this.state.name}</Tile>
        <button className="send-btn" onClick={this.send.bind(this, "tesgugt")}>
          {" "}
          send{" "}
        </button>
        <button className="reset-btn" onClick={this.reset}>
          {" "}
          reset{" "}
        </button>
      </div>
    );
  }
}

export default Page5;
