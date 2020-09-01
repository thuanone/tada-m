import React from "react";
import PropTypes from "prop-types";
import MemoryUtils from "./memory-utils";
import _ from "lodash";

import { Memory_1, vCPU } from "./units";

// TODO: add PropTypes

class QInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      //actively used properties
      value: props.value || "", // if no unit -> handle as bytes and calculate the best unit
      // if number -> handle as bytes and calculate the best unit
      // if string incl unit -> handle as-is
      // if undefined -> print '-'
      unitInUsePTR: props.defaultUnit || 0, // change this to this.unitMatch(minVal.match(/[a-z]+/gi).join(""), this.props) (doesnt work yet)
      message: "",
      isValid: true,
    };
    this.onChange = this.onChange.bind(this);
    this.onClick = this.onClick.bind(this);
    this.unitMatch = this.unitMatch.bind(this);
    this.validate = this.validate.bind(this);
    this.checkMinMax = this.checkMinMax.bind(this);

    this.addUnit = this.addUnit.bind(this);

    this.MemoryUtils = new MemoryUtils();
  }

  /**
   * this function makes sure that default values are fed to the parent component
   */
  componentDidMount() {
    this.validate(
      this.state.value,
      this.props.unitConfig,
      this.props.minVal,
      this.props.maxVal
    );
    this.populateToParent(this.state.value, this.props.unitConfigInUse);
  }

  convertValueToBaseUnit(number, unitPTR, unitConfig) {
    while (unitPTR > 0) {
      number = number * unitConfig[unitPTR - 1].convertUpAt;
      unitPTR -= 1;
    }
    return number;
  }
  checkMinMax(number, minVal, maxVal, unitPTR, unitConfig) {
    let checked = {
      number: number,
      message: "",
      unit: unitConfig[unitPTR].unit,
      unitPTR: unitPTR,
    };
    let minValUnit = minVal.match(/[a-z]+/gi).join("");
    let maxValUnit = maxVal.match(/[a-z]+/gi).join("");

    let minValBase = this.convertValueToBaseUnit(
      this.getNumber(minVal),
      this.unitMatch(minValUnit, unitConfig),
      unitConfig
    );
    let maxValBase = this.convertValueToBaseUnit(
      this.getNumber(maxVal),
      this.unitMatch(maxValUnit, unitConfig),
      unitConfig
    );
    let inputBase = this.convertValueToBaseUnit(number, unitPTR, unitConfig);
    if (minValBase <= inputBase && inputBase <= maxValBase) {
      return checked;
    }

    if (inputBase < minValBase) {
      checked.number = this.getNumber(minVal);
      checked.message = "minVal reached";
      checked.unitPTR = this.unitMatch(minValUnit, unitConfig);
      checked.unit = unitConfig[checked.unitPTR].unit;
      return checked;
    }

    if (inputBase > maxValBase) {
      checked.number = this.getNumber(maxVal);
      checked.message = "maxVal reached";
      checked.unitPTR = this.unitMatch(maxValUnit, unitConfig);
      checked.unit = unitConfig[checked.unitPTR].unit;
      return checked;
    }
    return checked;
  }

  /**
   * this functions receives a number and oth parameters and returns an object containing
   * - a new number
   * - a corresponding unit and its pointer
   * - and a message
   *
   * the passed number is either incremented, converted to a different unit or set to minVal if the number is below minval
   * @param {Number} number - number to be incremented
   * @param {Number} unitInUsePTR - Pointer needed to access certain information in unitConfig
   * @param {Array} unitConfig - Array of Objects containing informtation on units
   * @param {String} minVal - string in form "NUMBER UNIT"
   * @param {String} maxVal - string in form "NUMBER UNIT"
   */
  increment(number, unitInUsePTR, unitConfig, minVal, maxVal) {
    let newNumber = {
      number: number,
      message: "",
      unit: unitConfig[unitInUsePTR].unit,
      unitPTR: unitInUsePTR,
    };

    if (number === "-") {
      let minValUnit = minVal.match(/[a-z]+/gi).join(""); // extracting unit from minVal
      let unit = unitConfig[this.unitMatch(minValUnit, unitConfig)].unit;
      return {
        number: this.getNumber(minVal),
        unit: unit,
        unitPTR: this.unitMatch(minValUnit, unitConfig),
      };
    }

    let stepsize = unitConfig[unitInUsePTR].standardStepSize;
    newNumber.number = number + stepsize;

    let convertedNumber = this.convert(
      newNumber.number,
      unitInUsePTR,
      newNumber.unit,
      unitConfig
    ); //converting

    newNumber.unitPTR = convertedNumber.unitPTR;
    let checked = this.checkMinMax(
      convertedNumber.number,
      minVal,
      maxVal,
      convertedNumber.unitPTR,
      unitConfig
    );

    newNumber.unitPTR = checked.unitPTR;
    newNumber.unit = checked.unit;
    newNumber.number = checked.number;
    newNumber.message = checked.message;

    return newNumber;
  }

  /**
   * this functions receives a number and oth parameters and returns an object containing
   * - a new number
   * - a corresponding unit and its pointer
   * - and a message
   *
   * the passed number is either decremented, converted to a different unit or set to minVal if the number is below minval
   * @param {Number} number - number to be incremented
   * @param {Number} unitInUsePTR - Pointer needed to access certain information in unitConfig
   * @param {Array} unitConfig - Array of Objects containing informtation on units
   * @param {String} minVal - string in form "NUMBER UNIT"
   * @param {String} maxVal - string in form "NUMBER UNIT"
   */
  decrement(number, unitInUsePTR, unitConfig, minVal, maxVal) {
    let newNumber = {
      number: number,
      message: "",
      unit: unitConfig[unitInUsePTR].unit,
      unitPTR: unitInUsePTR,
    };
    if (number === "-") {
      let minValUnit = minVal.match(/[a-z]+/gi).join(""); // extracting unit from minVal
      let unit = unitConfig[this.unitMatch(minValUnit, unitConfig)].unit;
      return {
        number: this.getNumber(minVal),
        unit: unit,
        unitPTR: this.unitMatch(minValUnit, unitConfig),
      };
    }

    let stepsize = unitConfig[unitInUsePTR].standardStepSize;
    newNumber.number = number - stepsize;

    let convertedNumber = this.convert(
      newNumber.number,
      unitInUsePTR,
      newNumber.unit,
      unitConfig
    ); //converting

    newNumber.unitPTR = convertedNumber.unitPTR;

    let checked = this.checkMinMax(
      convertedNumber.number,
      minVal,
      maxVal,
      convertedNumber.unitPTR,
      unitConfig
    );
    newNumber.unitPTR = checked.unitPTR;
    newNumber.unit = checked.unit;
    newNumber.number = checked.number;
    newNumber.message = checked.message;

    return newNumber;
  }

  /**
   * this function receives a number, a corresponding unit with its pointer and an array of unit objects and returns
   * - a number
   * - a corresponding unit with its corresponding pointer
   * @param {Number} number
   * @param {Number} unitInUsePTR
   * @param {String} unit
   * @param {Array} unitConfig
   */
  convert(number, unitInUsePTR, unit, unitConfig) {
    let convertedNumber = { number, unit, unitPTR: unitInUsePTR };

    if (
      number >= unitConfig[unitInUsePTR].convertUpAt &&
      unitConfig[unitInUsePTR + 1] !== undefined
    ) {
      //up a unit
      while (
        convertedNumber.number >=
          unitConfig[convertedNumber.unitPTR].convertUpAt &&
        unitConfig[convertedNumber.unitPTR + 1] !== undefined
      ) {
        convertedNumber.number =
          Math.round(
            (convertedNumber.number * 10) /
              unitConfig[convertedNumber.unitPTR].convertUpAt
          ) / 10; // round 0.00 (2 digits)
        convertedNumber.unitPTR = convertedNumber.unitPTR + 1;
      }

      convertedNumber.unit = unitConfig[convertedNumber.unitPTR].unit; //{unit:} is assigned to String
    }
    if (number < 1 && unitConfig[unitInUsePTR - 1] !== undefined) {
      //down a unit
      convertedNumber.number =
        unitConfig[unitInUsePTR - 1].convertUpAt -
        unitConfig[unitInUsePTR - 1].standardStepSize;
      convertedNumber.unit = unitConfig[unitInUsePTR - 1].unit; //{unit:} is assigned to String
      convertedNumber.unitPTR = unitInUsePTR - 1;
    }
    convertedNumber.number = Math.round(convertedNumber.number * 10) / 10; // round 0.00 (2 digits)

    return convertedNumber;
  }
  /**
   * this function receives a String, scans for numbers and returns
   * - either an integer/decimal
   * - NaN if input contained no digits
   * - or "-" if input contained only "-"
   * @param {String} input
   */
  getNumber(input) {
    const numbersOnly = /-?[0-9]|\.?/gm;
    let numbersMatch;
    let number;

    try {
      //null / undefined
      numbersMatch = `${input}`.match(numbersOnly);
    } catch (error) {
      input = "-";
      this.setState({
        message: `undefined/null has been passed into get Number -> input turned to '-'`,
      });
    }
    number =
      input === ""
        ? 0 //????????
        : input === "-"
        ? "-"
        : numbersMatch
        ? parseFloat(numbersMatch.join(""))
        : "-";
    return number;
  }

  /**
   * takes a String and an Array of unit Objects and compares the String with the unit names
   * if it matches returns index of matched unit
   * if it does not match returns (String) "notValid"
   * @param {String} string
   * @param {Array} unitConfig
   */
  unitMatch(string, unitConfig) {
    if (!string) {
      //null / undefined '', falsy
      return "notValid";
    }

    var i;
    for (
      i = 0;
      i < unitConfig.length;
      i++ // Array Size (last one is none)
    )
      if (
        string.toUpperCase() === unitConfig[i].unit.toUpperCase() ||
        string.toUpperCase() === unitConfig[i].shortUnit.toUpperCase()
      ) {
        return i; // new unitInUsePTR
      }
    return "notValid";
  }

  /**
   * this functions checks if the form of a String is correct and returns an object containing
   * - a message
   * - a bool on whether or not the String is valid
   * - a pointer if a unit has been recognized
   * @param {String} userInput
   * @param {Array} units
   * @param {String} minVal
   * @param {String} maxVal
   */
  validate(userInput, unitConfig, minVal, maxVal) {
    const anythingButNumsLetters = /[^a-zA-Z0-9\s.]/gi;
    const justLetters = /[a-z]+/gi;
    const numbersAfterUnit = /.[a-z]+.[0-9]+/gi;

    let report = {
      message: " ",
      isValid: true,
      unitPTR: this.props.defaultUnit,
    };
    let otherChars,
      matchNumberAfterUnit,
      letters,
      word,
      number,
      indexOfMatchedUnit,
      checked;

    try {
      otherChars = `${userInput}`.match(anythingButNumsLetters);
      matchNumberAfterUnit = `${userInput}`.match(numbersAfterUnit);
      letters = `${userInput}`.match(justLetters);

      number = this.getNumber(userInput);
      word = letters !== null ? letters.join("") : "";
    } catch {
      report.message = "undefined / null passed into validate()";
      report.isValid = false;
      return report;
    }
    if (userInput === "-" || userInput === "") {
      report.isValid = true;
      return report;
    }
    if (otherChars) {
      report.message = `invalid Character used: "${otherChars}"`;
      report.isValid = false;
      return report;
    }
    if (matchNumberAfterUnit) {
      report.message = "please input in this format : [Number] [Unit]";
      report.isValid = false;
      return report;
    }
    if (isNaN(number)) {
      report.message = `${userInput} does not contain a valid number`;
      report.isValid = false;
      return report;
    }
    indexOfMatchedUnit = this.unitMatch(word, unitConfig);
    if (indexOfMatchedUnit === "notValid" && word !== "") {
      report.message = `${word} is not a valid unit`;
      report.isValid = false;
      return report;
    } else if (word === "") {
      report.isValid = true;
      word = unitConfig[this.props.defaultUnit].unit; // neccessary for checkMinMax
    } else {
      report.message = `recognized unit: ${word}`;
      report.unitPTR = indexOfMatchedUnit;
    }
    checked = this.checkMinMax(
      number,
      minVal,
      maxVal,
      this.unitMatch(word, unitConfig),
      unitConfig
    );
    if (checked.message === "") {
      return report;
    } else {
      report.message =
        checked.message === "minVal reached"
          ? `${userInput} is below minVal`
          : `${userInput} is above maxVal`;
      report.isValid = false;
      return report;
    }
  }

  /**
   * this function handles button clicks and sets
   * - new Values
   * - new unit pointers
   * - new messages
   * - valid flags
   * @param {String} buttonID
   * @param {Number} unitInUsePTR
   */
  onClick(buttonID, unitInUsePTR) {
    if (
      this.state.isValid ||
      (!this.state.isValid &&
        (this.state.message.match("minVal") ||
          this.state.message.match("maxVal")))
    ) {
      let number = this.getNumber(this.state.value); //if no number returns 0
      let newNumber = { number: number, message: "" };

      let minVal = this.props.minVal;
      let maxVal = this.props.maxVal;

      if (buttonID === "Increment") {
        newNumber = this.increment(
          number,
          unitInUsePTR,
          this.props.unitConfig,
          minVal,
          maxVal,
          this.props.unitConfigInUse
        );
      } else if (buttonID === "Decrement") {
        newNumber = this.decrement(
          number,
          unitInUsePTR,
          this.props.unitConfig,
          minVal,
          maxVal,
          this.props.unitConfigInUse
        );
      }
      this.setState(
        {
          value: newNumber.unit
            ? `${newNumber.number} ${newNumber.unit}`
            : newNumber.number,
          unitInUsePTR: newNumber.unitPTR,
          message: newNumber.message,
          isValid: true,
        },
        () => {
          this.populateToParent(this.state.value);
        }
      );
    } else {
      return;
    }
  }
  /**
   * this function handles input changes and sets
   * - new Values
   * - new unit pointers
   * - new messages
   * - valid flags
   * @param {} event
   */
  onChange(event) {
    let userInput = event.target.value;
    let report = this.validate(
      userInput,
      this.props.unitConfig,
      this.props.minVal,
      this.props.maxVal
    );

    this.setState(
      {
        value: userInput,
        message: report.message,
        isValid: report.isValid,
        unitInUsePTR: !isNaN(report.unitPTR)
          ? report.unitPTR
          : this.state.unitInUsePTR,
      },
      () => {
        this.populateToParent(userInput);
      }
    );
  }

  /**
   * this function feeds new values to the parent component
   * @param {String} value - this.state.value is passed to this function
   */
  populateToParent(value) {
    if (this.props.onUpdate && this.state.isValid) {
      let newValue;
      let numberValue = this.getNumber(`${value}`);
      newValue =
        value === "" || value === "-" || value === undefined
          ? "-"
          : this.convertValueToBaseUnit(
              numberValue,
              this.state.unitInUsePTR,
              this.props.unitConfig
            );
      if (!this.props.passValueAsNumbersOnly && newValue !== "-") {
        let unit = this.props.unitConfig[0].unit;
        newValue = `${newValue} ${unit}`;
      }
      this.props.onUpdate(newValue);
    } else if (this.props.onUpdate && !this.state.isValid) {
      this.props.onUpdate("-");
    }
  }
  addUnit() {
    if (
      this.state.isValid &&
      this.state.value !== "" &&
      !isNaN(this.state.value)
    ) {
      this.setState({
        value: `${this.state.value} ${
          this.props.unitConfig[this.state.unitInUsePTR].unit
        }`,
      });
    }
  }
  render() {
    const NumberInput = (
      <div>
        <label class="bx--label">QInput v1.0</label>
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
                  placeholder={this.props.placeholder}
                  value={this.state.value}
                  onChange={this.onChange}
                  onBlur={this.addUnit}
                />
                <svg
                  opacity={this.state.isValid ? 0 : 1}
                  focusable="false"
                  preserveAspectRatio="xMidYMid meet"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  class="bx--number__invalid"
                >
                  <path d="M8,1C4.2,1,1,4.2,1,8s3.2,7,7,7s7-3.1,7-7S11.9,1,8,1z M7.5,4h1v5h-1C7.5,9,7.5,4,7.5,4z M8,12.2    c-0.4,0-0.8-0.4-0.8-0.8s0.3-0.8,0.8-0.8c0.4,0,0.8,0.4,0.8,0.8S8.4,12.2,8,12.2z"></path>
                  <path
                    d="M7.5,4h1v5h-1C7.5,9,7.5,4,7.5,4z M8,12.2c-0.4,0-0.8-0.4-0.8-0.8s0.3-0.8,0.8-0.8    c0.4,0,0.8,0.4,0.8,0.8S8.4,12.2,8,12.2z"
                    data-icon-path="inner-path"
                    opacity="0"
                  ></path>
                </svg>
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
                        this.props.unitConfig
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
                        this.props
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
          Active Unit: {this.props.unitConfig[this.state.unitInUsePTR].unit}
        </div>

        <div class="bx--form__helper-text" style={{ color: "#da1e28" }}>
          {this.state.message}
        </div>
      </div>
    );
    return NumberInput;
  }
}
QInput.propTypes = {
  /**
   * Optional helper Text //-> to replace this.state.message
   */
  helperText: PropTypes.string,
  /**
   * Array of UnitObjects
   */
  units: PropTypes.array,
  /**
   * optional: the minimal value, by default set to 0
   */
  minVal: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /**
   * optional: the maximum value, by default set to undefined
   */
  maxVal: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /**
   * Define at which unit to start at
   */
  startingUnit: PropTypes.number,
  /**
   * specify function to feed parent component with information
   */
  onUpdate: PropTypes.func,
  /**
   *
   */
  passValueAsNumbersOnly: PropTypes.bool,
  /**
   *
   */
  defaultUnit: PropTypes.number,
};

QInput.defaultProps = {
  minVal: "1023 KiB",
  maxVal: "10 TiB",
  unitConfig: Memory_1,
  passValueAsNumbersOnly: false,
  defaultUnit: 0,
};

export default QInput;
