import React from "react";
import "./home.scss";
import { Checkbox } from "carbon-components-react";

class Home extends React.Component {
  render() {
    return (
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "45%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <h1 style={{ fontSize: "70px", marginBottom: "20px" }}>Home</h1>

        <fieldset className="bx--fieldset">
          <legend className="bx--label"> Tasks</legend>

          <Checkbox
            defaultChecked
            id="checked-1"
            labelText="creating react app"
          />
          <Checkbox
            defaultChecked
            id="checked-2"
            labelText="NumInput with CarbonDesign style"
          />
          <Checkbox
            defaultChecked
            id="checked-3"
            labelText="implement increment/ decrement function "
          />
          <Checkbox
            defaultChecked
            id="checked-4"
            labelText="implement min/max value"
          />
          <Checkbox
            defaultChecked
            id="checked-5"
            labelText="create new page for testing"
          />

          <Checkbox defaultChecked id="checked-5" labelText="-" />
          <Checkbox defaultChecked id="checked-6" labelText="-" />
        </fieldset>
      </div>
    );
  }
}

export default Home;
