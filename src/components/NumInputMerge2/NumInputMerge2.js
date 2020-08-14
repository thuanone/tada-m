import React from "react";

import PropTypes from "prop-types";

// TODO: add PropTypes

class NumInputMerge2 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      //actively used properties
      value: props.value || "", // if no unit -> handle as bytes and calculate the best unit
      // if number -> handle as bytes and calculate the best unit
      // if string incl unit -> handle as-is
      // if undefined -> print '-'
      unitInUsePTR: props.unitInUsePTR ? props.unitInUsePTR : 0,
      message: "",
      isValid: true,
    };
    this.onChange = this.onChange.bind(this);
    this.onClick = this.onClick.bind(this);
    this.unitMatch = this.unitMatch.bind(this);
    this.validate = this.validate.bind(this);

    this.Configuration = this.props;
  }

  //currently not in use
  onComponentUpdate(prevProps) {
    console.log("hello ");
    if (prevProps && prevProps.value !== this.props.value) {
      this.setState({ value: this.props.value });
    }
  }

  increment(number, unitInUsePTR, Config) {
    if (number === "-") {
      return { number: 1, message: "" };
    }
    let stepsize = Config.unitConfig[unitInUsePTR].standardStepSize;
    let newNumber = number + stepsize;
    return newNumber > Config.general.maxVal //is incrementedNumber bigger than maxVal? //funktioniert weil newNum> undefined
      ? { number: number, message: "maxVal reached" } //true -> return current number
      : { number: newNumber, message: "" }; //false -> return new Number
  }

  decrement(number, unitInUsePTR, Config) {
    if (number === "-") {
      return { number: 0, message: "" };
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
      convertedNumber.number =
        1024 - Config.unitConfig[unitInUsePTR - 1].standardStepSize;
      convertedNumber.unit = unitConfig[unitInUsePTR - 1].unit; //{unit:} is assigned to String
      convertedNumber.unitPTR = unitInUsePTR - 1;
    }
    return convertedNumber;
  }

  getNumber(input) {
    //const numbersOnly = /-?[0-9]+/gm;
    const numbersOnly = /-?[0-9]|\.?/gm;
    //const numbersOnly = /(-?[0-9]+)(\.?[0-9]+)?/gm;
    //const numbersOnly = /(-?[0-9]+)(\.?)([0-9]+)?/gm;
    let numbersMatch;
    let number;

    try {
      //null / undefined
      numbersMatch = input.match(numbersOnly);
    } catch (error) {
      input = "-";
      this.setState({
        message: `undefined/null has been passed into get Number -> input turned to '-'`,
      });
    }

    number =
      input === ""
        ? 0 //does not occur because no input has been set to invalid
        : input === "-"
        ? "-"
        : numbersMatch
        ? parseFloat(numbersMatch.join(""))
        : "-";
    console.log(input, numbersMatch, number, this.state.message);
    return number;
  }

  unitMatch(string, Config) {
    if (!string) {
      //null / undefined '', falsy
      return "notValid";
    }
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
    const regexNumberAfterUnit = /.[a-z]+.[0-9]+/gi;
    //const regexSpecialCharacters = //
    let report = { message: " ", isValid: true, newPTR: 0 };
    let returnUnitMatch;
    //let matchedNumRX; //= userInput.match(regexNum);
    //let matchedStringRX; // = userInput.match(regexString);
    let matchedNumRX, matchedStringRX, matchedNum, matchedString;

    try {
      // undefined / null userInput
      matchedNumRX = userInput.match(regexNum);
      matchedStringRX = userInput.match(regexString);
    } catch {
      report.isValid = false;
      report.message = "passed null/undefined into validate";
      return report;
    }

    if (userInput === "-" || userInput === "") {
      //accept '-' as a valid string -> atm '-' !== undefined
      report.isValid = true;
      return report;
    }

    if (userInput.match(regexNumberAfterUnit)) {
      // 10 mb 10 invalid , or mb 10
      report.isValid = false;
      report.message = "please input in this format : [Number] [Unit]";
      return report;
    }
    /** ==>*/ matchedNum = matchedNumRX !== null ? matchedNumRX.join("") : "";
    /** ==>*/ matchedString =
      matchedStringRX !== null ? matchedStringRX.join("") : "";

    if (isNaN(parseFloat(matchedNum))) {
      // Checks if a number comes first
      report.message = `${matchedNum}  is not a valid number`;
      report.isValid = false;
      return report;
    }

    returnUnitMatch = this.unitMatch(matchedString, Config.unitConfig); // either new unitInUsePTR or 'notValid'

    if (returnUnitMatch !== "notValid") {
      if (returnUnitMatch === 0 && !Number.isInteger(parseFloat(matchedNum))) {
        report.message = `please use Integers with ${matchedString}`;
        //report.newPTR = returnUnitMatch; -> report.newPTR is set to 0 by default
      }
      report.message = `recognized unit: ${matchedString}`;
      report.newPTR = returnUnitMatch;
    } else {
      if (matchedString === "") {
        //if no unit is input -> just takes number and applies unitInUse
        //report.message = "please enter a valid unit";
        report.isValid = true;
      } else {
        report.message = `${matchedString} is not a valid unit`;
        report.isValid = false;
      }
    }
    /** ==>*/ return report;
  }
  onClick(buttonID, unitInUsePTR, Config) {
    if (!this.state.isValid) {
      return;
    } else {
      let nullIfNoMatch = this.state.value.match(/[a-z]+/gi); //produces null if no match
      let unit = nullIfNoMatch
        ? nullIfNoMatch.join() //if theres a match take unit
        : Config.unitConfig[unitInUsePTR].unit; //if no match get unitInUse
      let number = this.getNumber(this.state.value); //if no number returns 0
      let newNumber = { number: number, message: "" };
      let returnConverted  = {number: number, unit: unit, unitPTR: unitInUsePTR};

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
      this.setState(
        {
          value: `${returnConverted.number} ${returnConverted.unit}`,
          unitInUsePTR: returnConverted.unitPTR,
          message: newNumber.message,
        },
        () => {
          this.populateToParent(this.state.value);
        }
      );
    }
  }

  onChange(event) {
    let Config = this.props;
    let userInput = event.target.value;
    let report = this.validate(userInput, Config, this.state.unitInUsePTR);
    //
    this.setState(
      {
        value: userInput,
        message: report.message,
        isValid: report.isValid,
        unitInUsePTR: !isNaN(report.newPTR)
          ? report.newPTR
          : this.state.unitInUsePTR,
      },
      () => {
        this.populateToParent(userInput);
      }
    );
  }

  populateToParent(value) {
    if (this.props.onUpdate) {
      let newValue;
      newValue =
        value === "" ? "-" : isNaN(value) ? value : this.getNumber(value);
      // TODO check whether the value should be populated as string or as number (aka bytes) : √
      // if the newValue === '-' -> tbd
      this.props.onUpdate(newValue);
    }
  }

  render() {
    return (
      <div>
        <label class="bx--label">NumInputMerge vThuan#AdamsKrank</label>

        <div class="bx--form-item bx--text-input-wrapper">
          <div class="bx--number bx--number--helpertext">
            <div class="bx--text-input__field-outer-wrapper">
              <div
                class="bx--text-input__field-wrapper"
                data-invalid={!this.state.isValid || null}
              >
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
NumInputMerge2.propTypes = {
  /**
   * optional starting value
   */
  defaultValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /**
   * Optional helper Text //-> to replace this.state.message
   */
  helperText: PropTypes.string,
  /**
   * Array of UnitObjects
   */
  unitConfig: PropTypes.array,
  /**
   * optional: the minimal value, by default set to 0
   */
  minVal: PropTypes.number,
  /**
   * optional: the maximum value, by default set to undefined
   */
  maxVal: PropTypes.number,
};

NumInputMerge2.defaultProps = {
  
};

export default NumInputMerge2;
