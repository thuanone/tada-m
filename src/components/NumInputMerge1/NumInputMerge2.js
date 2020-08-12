import React from "react";

class NumInputMerge2 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      //actively used properties
      value: "",
      unitInUsePTR: props.unitInUsePTR ? props.unitInUsePTR : 0,
      message: "",
      isValid: false,
    };

    this.onChange = this.onChange.bind(this);
    this.onClick = this.onClick.bind(this);
    this.unitMatch = this.unitMatch.bind(this);
    this.validate = this.validate.bind(this);
    /*
    this.ConfigBase = this.props.general // Base Config e.g. min/max Value
    this.Confignits = this.props.unitSpec // Units e.g. MiB -> stepsize , GiB -> stepsize
    */

    this.Configuration = this.props;
  }
  increment(number, unitInUsePTR, Config) {
    if (number === '-') {
      return {number: 1, message:''};
    }
    let stepsize = Config.unitConfig[unitInUsePTR].standardStepSize;
    let newNumber = number + stepsize;
    return newNumber > Config.general.maxVal //is incrementedNumber bigger than maxVal?
      ? { number: number, message: "maxVal reached" } //true -> return current number
      : { number: newNumber, message: "" }; //false -> return new Number
  }

  decrement(number, unitInUsePTR, Config) {
    if (number === '-') {
      return {number: 0, message:''};
    }
    let stepsize = Config.unitConfig[unitInUsePTR].standardStepSize;
    let newNumber = number - stepsize;

    return newNumber < Config.general.minVal //is decrementedNumber smaller than minVal
      ? { number: number, message: "minVal reached" } //true -> return current number
      : { number: newNumber, message: "" }; //false -> return new Number
  }

  convert(number, unitInUsePTR, unit, Config) {
    let convertedNumber = { number, unit, unitPTR: unitInUsePTR };
    let unitConfig = Config.unitConfig;

    if (number >= 1024 && unitConfig[unitInUsePTR + 1] !== undefined) {
      convertedNumber.number = Math.round(number / 1024);
      convertedNumber.unit = unitConfig[unitInUsePTR + 1].unit; //{unit:} is assigned to String
      convertedNumber.unitPTR = unitInUsePTR + 1;
    }
    if (number < 1 && unitConfig[unitInUsePTR - 1] !== undefined) {
      convertedNumber.number = 1024 - Config.unitConfig[unitInUsePTR - 1].standardStepSize;
      convertedNumber.unit = unitConfig[unitInUsePTR - 1].unit; //{unit:} is assigned to String
      convertedNumber.unitPTR = unitInUsePTR - 1;
    }
    return convertedNumber;
  }

  getNumber(input) {
    const numbersOnly = /-?[0-9]|./gm;
    let numbersMatch = input.match(numbersOnly);
    let number =  input === '' ? '-'
    : numbersMatch ? parseFloat(numbersMatch.join(''))
    : 0;
    return number;
  }

  unitMatch(string, Config) {
    var i;
    for (
      i = 0;
      i < Config.length;
      i++ // Array Size (last one is none)
    )
      if (
        string.toUpperCase() === Config[i].unit.toUpperCase() ||
        string.toUpperCase() === Config[i].shortUnit.toUpperCase()
      ) {
        return i; // new unitInUsePTR
      }
    return "notValid";
  }

  validate(userInput, Config) {
    const regexNum = /-?[0-9]+/gi;
    const regexString = /[a-z]+/gi;

    let matchedNum = userInput.match(regexNum);
    let matchedString = userInput.match(regexString);

    let report = {
      message: " ",
      isValid: true,
      newPTR: "",
    };

    if (matchedNum !== null) {
      matchedNum = matchedNum.join("");
    } else {
      matchedNum = "";
    }

    if (matchedString !== null) {
      matchedString = matchedString.join("");
    } else {
      matchedString = "";
    }

    if (isNaN(parseFloat(matchedNum))) {
      // Checks if a number comes first
      report.message = `${matchedNum}  is not a valid number`;
      report.isValid = false;
      return report;
    }

    let returnUnitMatch = this.unitMatch(matchedString, Config.unitConfig); // either new unitInUsePTR or '' (none)

    if (returnUnitMatch !== "notValid") {
      // checks if the unit comes next
      report.message = `recognized unit: ${matchedString}`;
      report.newPTR = returnUnitMatch;
    } else {
      if (matchedString === "") {
        report.message = "please enter a valid unit";
      } else {
        report.message = `${matchedString} is not a valid unit`;
      }
      report.isValid = false;
    }

    return report;
  }
  onClick(buttonID, unitInUsePTR, Config) {
    if (!this.state.isValid) {
      return;
    } else {
      let nullIfNoMatch = this.state.value.match(/[a-z]+/gi); //produces null if no match
      let unit = nullIfNoMatch
        ? nullIfNoMatch.join()
        : Config.unitConfig[unitInUsePTR].unit; //unit equals either typeInput or unitInUse
      let number = this.getNumber(this.state.value); //if no number returns 0
      let newNumber = { number: number, message: "" };
      let returnConverted /** = {number: number, unit: unit, unitPTR: unitInUsePTR} */;

      if (buttonID === "Increment") {
        newNumber = this.increment(number, unitInUsePTR, Config);
      } else if (buttonID === "Decrement") {
        newNumber = this.decrement(number, unitInUsePTR, Config);
      }
      /* ==> */ returnConverted = this.convert(
        newNumber.number,
        unitInUsePTR,
        unit,
        Config
      );

      this.setState({
        value: `${returnConverted.number} ${returnConverted.unit}`,
        unitInUsePTR: returnConverted.unitPTR,
        message: newNumber.message,
      });
    }
  }

  onChange(event) {
    let Config = this.props;
    let userInput = event.target.value;
    let report = userInput.validate(userInput, Config, this.state.unitInUsePTR);
    //
    this.setState({
      value: userInput,
      message: report.message,
      isValid: report.isValid,
      unitInUsePTR: report.newPTR ? report.newPTR : this.state.unitInUsePTR,
    });
  }

  render() {
    return (
      <div>
        <label class="bx--label">NumInputMerge vThuan#AdamsKrank</label>

        <div class="bx--form-item bx--text-input-wrapper">
          <div class="bx--number bx--number--helpertext">
            <div class="bx--text-input__field-outer-wrapper">
              <div class="bx--text-input__field-wrapper">
                <input
                  class="bx--text-input bx--text__input"
                  type="text"
                  aria-label="Numeric input field with increment and decrement buttons"
                  placeholder="e.g. 1 MiB"
                  value={this.state.value}
                  onChange={this.onChange}
                />

                <div class="bx--number__controls">
                  <button
                    class="bx--number__control-btn up-icon"
                    type="button"
                    title="Increment number"
                    aria-label="Increment number"
                    aria-live="polite"
                    aria-atomic="true"
                    id="incrementButton"
                    isincrement={true}
                    onMouseDown={() =>
                      this.onClick(
                        "Increment",
                        this.state.unitInUsePTR,
                        this.Configuration
                      )
                    }
                  >
                    <svg
                      focusable="false"
                      preserveAspectRatio="xMidYMid meet"
                      style={{ willChange: "transform" }}
                      xmlns="http://www.w3.org/2000/svg"
                      width="8"
                      height="4"
                      viewBox="0 0 8 4"
                      aria-hidden="true"
                      class="up-icon"
                    >
                      <path d="M0 4l4-4 4 4z"></path>
                    </svg>
                  </button>

                  <button
                    class="bx--number__control-btn down-icon"
                    type="button"
                    title="Decrement number"
                    aria-label="Decrement number"
                    aria-live="polite"
                    aria-atomic="true"
                    id="decrementButton"
                    isincrement={false}
                    onMouseDown={() =>
                      this.onClick(
                        "Decrement",
                        this.state.unitInUsePTR,
                        this.Configuration
                      )
                    }
                  >
                    <svg
                      focusable="false"
                      preserveAspectRatio="xMidYMid meet"
                      style={{ willChange: "transform" }}
                      xmlns="http://www.w3.org/2000/svg"
                      width="8"
                      height="4"
                      viewBox="0 0 8 4"
                      aria-hidden="true"
                      class="down-icon"
                    >
                      <path d="M8 0L4 4 0 0z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bx--form__helper-text">
          Active Unit:{" "}
          {this.Configuration.unitConfig[this.state.unitInUsePTR].unit}
        </div>

        <div class="bx--form__helper-text">{this.state.message}</div>
      </div>
    );
  }
}

export default NumInputMerge2;
