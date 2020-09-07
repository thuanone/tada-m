import React, { Component } from "react";
import PropTypes from "prop-types";
import _ from "lodash";

import { Memory_1 } from "./units";

interface IQInputProps {
  value?: NumberOrString,
  unitConfig: Unit[],
  minVal: string,
  maxVal: string,
  placeholder?: string,
  onUpdate?: (populate: onPopulate) => void,
  passValueAsNumbersOnly?: boolean,
  defaultUnit: number,
}

interface IQInputState {
  value: NumberOrString,
  unitInUsePTR: number,
  message: string,
  isValid: boolean
}

type NumberOrString = number | string

interface Unit {
  unit: string,
  shortUnit: string,
  standardStepSize: number,
  convertUpAt: number
}

interface onPopulate{
  value: NumberOrString,
  message: string,
  valid: boolean,
}

class QInput extends Component<IQInputProps, IQInputState> {

  static propTypes = {
    defaultProps: {
      minVal: "1023 KiB",
      maxVal: "10 TiB",
      unitConfig: Memory_1,
      passValueAsNumbersOnly: false,
      defaultUnit: 1,
      placeholder: "e.g. 1 MiB",
    },
    value: PropTypes.string,
    /**
     * Optional helper Text //-> to replace this.state.message
     *
    helperText: PropTypes.string,
    /**
     * Array of UnitObjects
     */
    unitConfig: PropTypes.array,
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
     *
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
  }

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
    this.populateToParent(this.state.value);
  }


  /**
   * this functions takes a number and current unit pointer and converts it down to its base unit
   * @param {Number} number - number to convert
   * @param {Number} unitPTR - corresponding unit pointer
   * @param {Number} unitConfig - unit object array to traverse
   */

  convertValueToBaseUnit(num: number, unitPTR: NumberOrString, unitConfig: Unit[]) {
    try {
      while (unitPTR as number > 0) {
        num = num * unitConfig[unitPTR as number - 1].convertUpAt;
        (unitPTR as number) -= 1;
      }
      return num;

    } catch (error) {
      throw new Error(`unitPTR is not a number: ${error}`);
    }
  }

  /**
   * this function takes a number with its corresponding unit pointer and checks whether or not it is within min/maxVal borders
   * - if so returns number and pointer as is
   * - if not returns maxVal Value or minVal Value with their corresponding unit pointer
   * @param {Number} num - value to check if within min max
   * @param {String} minVal - minVal String in form "[Number] [Unit]"
   * @param {String} maxVal - maxVal String in form "[Number] [Unit]"
   * @param {Number} unitPTR - corresponding unit pointer to value to be checked
   * @param {Array} unitConfig - array of unit objects
   */
  checkMinMax(num: number, minVal: string, maxVal: string, unitPTR: any, unitConfig: Unit[]) {
    let checked = {
      num: num,
      message: "",
      unit: unitConfig[unitPTR].unit,
      unitPTR: unitPTR,
    };

    const minValUnitMatch = minVal.match(/[a-z]+/gi);
    const minValUnit = minValUnitMatch ? minValUnitMatch.join("") : '';
    const maxValUnitMatch = maxVal.match(/[a-z]+/gi);
    const maxValUnit = maxValUnitMatch ? maxValUnitMatch.join("") : '';

    let minValBase = this.convertValueToBaseUnit(
      this.getNumber(minVal),
      this.unitMatch(minValUnit, unitConfig),
      unitConfig
    );
    let maxValBase: number = this.convertValueToBaseUnit(
      this.getNumber(maxVal),
      this.unitMatch(maxValUnit, unitConfig),
      unitConfig
    );
    let inputBase: number = this.convertValueToBaseUnit(num, unitPTR, unitConfig);
    if (minValBase <= inputBase && inputBase <= maxValBase) {
      return checked;
    }

    if (inputBase < minValBase) {
      checked.num = this.getNumber(minVal);
      checked.message = "minVal reached";
      checked.unitPTR = this.unitMatch(minValUnit, unitConfig);
      checked.unit = unitConfig[checked.unitPTR].unit;
      return checked;
    }

    if (inputBase > maxValBase) {
      checked.num = this.getNumber(maxVal);
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
   * @param {Number} num - number to be incremented
   * @param {Number} unitInUsePTR - Pointer needed to access certain information in unitConfig
   * @param {Array} unitConfig - Array of Objects containing informtation on units
   * @param {String} minVal - string in form "NUMBER UNIT"
   * @param {String} maxVal - string in form "NUMBER UNIT"
   */
  increment(num: NumberOrString, unitInUsePTR: number, unitConfig: Unit[], minVal: string, maxVal: string) {
    let newNumber: any = {
      num,
      message: "",
      unit: unitConfig[unitInUsePTR].unit,
      unitPTR: unitInUsePTR,
    };

    if (num === "-") {
      const minValUnitMatch = minVal.match(/[a-z]+/gi);
      const minValUnit = minValUnitMatch ? minValUnitMatch.join("") : '';
      let unit: string = unitConfig[this.unitMatch(minValUnit, unitConfig)].unit;
      return {
        num: this.getNumber(minVal),
        unit: unit,
        unitPTR: this.unitMatch(minValUnit, unitConfig),
      };
    }

    let stepsize: number = unitConfig[unitInUsePTR].standardStepSize;
    newNumber.num = num as number + stepsize;

    let convertedNumber: any = this.convert(
      newNumber.num,
      unitInUsePTR,
      newNumber.unit,
      unitConfig
    ); //converting

    newNumber.unitPTR = convertedNumber.unitPTR;
    let checked: any = this.checkMinMax(
      convertedNumber.num,
      minVal,
      maxVal,
      convertedNumber.unitPTR,
      unitConfig
    );

    newNumber.unitPTR = checked.unitPTR;
    newNumber.unit = checked.unit;
    newNumber.num = checked.num;
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
   * @param {Number} num - number to be incremented
   * @param {Number} unitInUsePTR - Pointer needed to access certain information in unitConfig
   * @param {Array} unitConfig - Array of Objects containing informtation on units
   * @param {String} minVal - string in form "NUMBER UNIT"
   * @param {String} maxVal - string in form "NUMBER UNIT"
   */
  decrement(num: NumberOrString, unitInUsePTR: number, unitConfig: any, minVal: string, maxVal: string) {
    let newNumber: any = {
      num: num,
      message: "",
      unit: unitConfig[unitInUsePTR].unit,
      unitPTR: unitInUsePTR,
    };
    if (num === "-") {
      const minValUnitMatch = minVal.match(/[a-z]+/gi);
      const minValUnit = minValUnitMatch ? minValUnitMatch.join("") : '';
      let unit: string = unitConfig[this.unitMatch(minValUnit, unitConfig)].unit;
      return {
        num: this.getNumber(minVal),
        unit: unit,
        unitPTR: this.unitMatch(minValUnit, unitConfig),
      };
    }

    let stepsize: number = unitConfig[unitInUsePTR].standardStepSize;
    newNumber.num = num as number - stepsize;

    let convertedNumber: any = this.convert(
      newNumber.num,
      unitInUsePTR,
      newNumber.unit,
      unitConfig
    ); //converting

    newNumber.unitPTR = convertedNumber.unitPTR;

    let checked: any = this.checkMinMax(
      convertedNumber.num,
      minVal,
      maxVal,
      convertedNumber.unitPTR,
      unitConfig
    );
    newNumber.unitPTR = checked.unitPTR;
    newNumber.unit = checked.unit;
    newNumber.num = checked.num;
    newNumber.message = checked.message;

    return newNumber;
  }

  /**
   * this function receives a number, a corresponding unit with its pointer and an array of unit objects and returns
   * - a converted number
   * - a corresponding unit with its corresponding pointer
   * @param {Number} num - number to be converted into a new unit
   * @param {Number} unitInUsePTR - pointer for current unit in use
   * @param {String} unit - string of current unit
   * @param {Array} unitConfig - array of unit objects
   */
  convert(num: number, unitInUsePTR: number, unit: string, unitConfig: Unit[]) {
    let convertedNumber: any = { num, unit, unitPTR: unitInUsePTR };

    if (
      num >= unitConfig[unitInUsePTR].convertUpAt &&
      unitConfig[unitInUsePTR + 1] !== undefined
    ) {
      //up a unit
      while (
        convertedNumber.num >=
        unitConfig[convertedNumber.unitPTR].convertUpAt &&
        unitConfig[convertedNumber.unitPTR + 1] !== undefined
      ) {
        convertedNumber.num =
          Math.round(
            (convertedNumber.num * 10) /
            unitConfig[convertedNumber.unitPTR].convertUpAt
          ) / 10; // round 0.00 (2 digits)
        convertedNumber.unitPTR = convertedNumber.unitPTR + 1;
      }

      convertedNumber.unit = unitConfig[convertedNumber.unitPTR].unit;
    }
    if (num < 1 && unitConfig[unitInUsePTR - 1] !== undefined) {
      //down a unit
      convertedNumber.num =
        unitConfig[unitInUsePTR - 1].convertUpAt -
        unitConfig[unitInUsePTR - 1].standardStepSize;
      convertedNumber.unit = unitConfig[unitInUsePTR - 1].unit;
      convertedNumber.unitPTR = unitInUsePTR - 1;
    }
    convertedNumber.num = Math.round(convertedNumber.num * 10) / 10; // round 0.00 (2 digits)

    return convertedNumber;
  }
  /**
   * this function receives a String, scans for numbers and returns
   * - either an integer/decimal
   * - NaN if input contained no digits
   * - or "-" if input contained only "-"
   * @param {String} input
   */
  getNumber(input: any) {
    const numbersOnly = /-?[0-9]|\.?/gm;
    let numbersMatch;
    let num;

    try {
      //null / undefined
      numbersMatch = `${input}`.match(numbersOnly);
    } catch (error) {
      input = "-";
      this.setState({
        message: `undefined/null has been passed into get Number -> input turned to '-'`,
      });
    }
    num =
      input === ""
        ? 0 //????????
        : input === "-"
          ? "-"
          : numbersMatch
            ? parseFloat(numbersMatch.join(""))
            : "-";
    return num;
  }

  /**
   * takes a String and an Array of unit Objects and compares the String with the unit names
   * if it matches returns index of matched unit
   * if it does not match returns (number) -1
   * @param {String} string
   * @param {Array} unitConfig
   */
  unitMatch(string: string, unitConfig: Unit[]): number {
    if (!string) {
      //null / undefined '', falsy
      return -1;
    }

    var i: number;
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
    return -1;
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
  validate(userInput: any, unitConfig: any, minVal: string, maxVal: string) {
    const anythingButNumsLetters = /[^a-zA-Z0-9\s.]/gi;
    const stringRX = /[a-z]+/gi;
    const numbersAfterUnit = /.[a-z]+.[0-9]+/gi;

    let report: any = {
      message: " ",
      isValid: true,
      unitPTR: this.props.defaultUnit,
    };
    let otherChars,
      matchNumberAfterUnit: any,
      word: string,
      wordMatch: any,
      num: number,
      indexOfMatchedUnit: number,
      checked: any;

    try {
      otherChars = `${userInput}`.match(anythingButNumsLetters);
      matchNumberAfterUnit = `${userInput}`.match(numbersAfterUnit);

      wordMatch = `${userInput}`.match(stringRX);
      word = wordMatch ? wordMatch.join("") : '';

      num = this.getNumber(userInput);
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
    if (isNaN(num)) {
      report.message = `${userInput} does not contain a valid number`;
      report.isValid = false;
      return report;
    }
    indexOfMatchedUnit = this.unitMatch(word, unitConfig);
    if (indexOfMatchedUnit === -1 && word !== "") {
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
      num,
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
  onClick(buttonID: string, unitInUsePTR: number, unitConfig: Unit[]) {
    if (
      this.state.isValid ||
      (!this.state.isValid &&
        (this.state.message.match("minVal") ||
          this.state.message.match("maxVal")))
    ) {
      let num: number = this.getNumber(this.state.value); //if no number returns 0
      let newNumber: any = { num: num, message: "" };

      let minVal: string = this.props.minVal;
      let maxVal: string = this.props.maxVal;

      if (buttonID === "Increment") {
        newNumber = this.increment(
          num,
          unitInUsePTR,
          unitConfig,
          minVal,
          maxVal,
        );
      } else if (buttonID === "Decrement") {
        newNumber = this.decrement(
          num,
          unitInUsePTR,
          unitConfig,
          minVal,
          maxVal,
        );
      }
      this.setState(
        {
          value: newNumber.unit
            ? `${newNumber.num} ${newNumber.unit}`
            : newNumber.num,
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
    let userInput: any = event.target.value;
    let report: any = this.validate(
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
  populateToParent(value: any) {
    let populate: onPopulate = {
      value: "-",
      message: "",
      valid: this.state.isValid,
    };
    if (!this.props.onUpdate) {
      return;
    }
    if (!this.state.isValid) {
      populate.message = "invalid";
      this.props.onUpdate(populate);
      return;
    }

    let numberValue: number = this.getNumber(`${value}`);
    populate.value =
      value === "" || value === "-" || value === undefined
        ? "-"
        : this.convertValueToBaseUnit(
          numberValue,
          this.state.unitInUsePTR,
          this.props.unitConfig
        );
    if (!this.props.passValueAsNumbersOnly && populate.value !== "-") {
      let unit: string = this.props.unitConfig[0].unit;
      populate.value = `${populate.value} ${unit}`;
    }
    this.props.onUpdate(populate);
  }
  addUnit() {
    if (
      this.state.isValid &&
      this.state.value !== "" &&
      !isNaN(this.state.value as number)) {
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
        <label className="bx--label">QInput v1.0</label>
        <div className="bx--form-item bx--text-input-wrapper">
          <div className="bx--number bx--number--helpertext">
            <div className="bx--text-input__field-outer-wrapper">
              <div
                className="bx--text-input__field-wrapper"
                data-invalid={!this.state.isValid || null}
              >
                <input
                  className="bx--text-input bx--text__input"
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
                  className="bx--number__invalid"
                >
                  <path d="M8,1C4.2,1,1,4.2,1,8s3.2,7,7,7s7-3.1,7-7S11.9,1,8,1z M7.5,4h1v5h-1C7.5,9,7.5,4,7.5,4z M8,12.2    c-0.4,0-0.8-0.4-0.8-0.8s0.3-0.8,0.8-0.8c0.4,0,0.8,0.4,0.8,0.8S8.4,12.2,8,12.2z"></path>
                  <path
                    d="M7.5,4h1v5h-1C7.5,9,7.5,4,7.5,4z M8,12.2c-0.4,0-0.8-0.4-0.8-0.8s0.3-0.8,0.8-0.8    c0.4,0,0.8,0.4,0.8,0.8S8.4,12.2,8,12.2z"
                    data-icon-path="inner-path"
                    opacity="0"
                  ></path>
                </svg>
                <div className="bx--number__controls">
                  <button
                    className="bx--number__control-btn up-icon"
                    type="button"
                    title="Increment number"
                    aria-label="Increment number"
                    aria-live="polite"
                    aria-atomic="true"
                    id="incrementButton"
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
                      className="up-icon"
                    >
                      <path d="M0 4l4-4 4 4z"></path>
                    </svg>
                  </button>
                  <button
                    className="bx--number__control-btn down-icon"
                    type="button"
                    title="Decrement number"
                    aria-label="Decrement number"
                    aria-live="polite"
                    aria-atomic="true"
                    id="decrementButton"
                    onMouseDown={() =>
                      this.onClick(
                        "Decrement",
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
                      className="down-icon"
                    >
                      <path d="M8 0L4 4 0 0z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bx--form__helper-text">
          Active Unit: {this.props.unitConfig[this.state.unitInUsePTR].unit}
        </div>

        <div className="bx--form__helper-text" style={{ color: "#da1e28" }}>
          {this.state.message}
        </div>
      </div>
    );
    return NumberInput;
  }
}
/*
QInput.defaultProps = {
  minVal: "1023 KiB",
  maxVal: "10 TiB",
  unitConfig: Memory_1,
  passValueAsNumbersOnly: false,
  defaultUnit: 1,
  placeholder:"e.g. 1 MiB",
};
*/

export default QInput;