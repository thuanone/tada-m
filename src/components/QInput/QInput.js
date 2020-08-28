import React from "react";
import PropTypes from "prop-types";
import MemoryUtils from "./memory-utils";

import { Memory, vCPU } from "./units";

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
      unitInUsePTR: props.unitInUsePTR ? props.unitInUsePTR : 0, // change this to this.unitMatch(minVal.match(/[a-z]+/gi).join(""), this.props) (doesnt work yet)
      message: "",
      isValid: true,
    };
    this.onChange = this.onChange.bind(this);
    this.onClick = this.onClick.bind(this);
    this.unitMatch = this.unitMatch.bind(this);
    this.validate = this.validate.bind(this);
    this.checkMinMax = this.checkMinMax.bind(this);

    this.convertValuetoCPU = this.convertValuetoCPU.bind(this);

    this.MemoryUtils = new MemoryUtils();
  }

  /**
   * this function makes sure that default values are fed to the parent component
   */
  componentDidMount() {
    this.validate(this.state.value);
    this.populateToParent(this.state.value);
  }

  convertValuetoCPU(val) {
    const numberRX = /-?[0-9]|\.?/gm;
    const unitRX = /[a-z]+/gi;

    let number = val.match(numberRX).join(""); // extract number
    let unit = val.match(unitRX).join(""); // extract unit

    if (unit == "vCPU" || unit == "CPU") {
      number = number * 1000;
    }

    return number;
  }

  /**
   * this function checks whether a quantity is under/above a set min/max Value and returns an Object containing
   * a number, which is either the number passed or min/max-Val's number
   * a message,
   * and a corresponding unit for number
   *
   * @param {Number} input - number to be checked
   * @param {String} unit - corresponding unit to number
   * @param {String} minVal - string in form "NUMBER UNIT"
   * @param {String} maxVal - string in form "NUMBER UNIT"
   * @param {Array} unitConfig - Array of nested Objects which contain information about a unit
   */
  checkMinMax(input, minVal, maxVal, unit, unitConfig, unitConfigInUse) {
    let checked = {
      number: input,
      message: "",
      unit: unit,
      unitPTR: this.unitMatch(unit, unitConfig),
    };
    if (unitConfigInUse === "Memory") {
      // if Memory is used e.g. MiB, GiB, MB, GB
      let minValByte = this.MemoryUtils.convertValueToBytes(minVal);
      let maxValByte = this.MemoryUtils.convertValueToBytes(maxVal);
      let inputByte = this.MemoryUtils.convertValueToBytes(input + unit);

      //special case for minVal = "0 UNIT" because convertValueToBytes doesnt handle negative values
      if (
        this.getNumber(minVal) === 0 &&
        minVal.match("MiB") &&
        input < this.getNumber(minVal)
      ) {
        let minValUnit = minVal.match(/[a-z]+/gi).join(""); // extracting unit from maxVal
        checked.number = this.getNumber(minVal);
        checked.unitPTR = this.unitMatch(minValUnit, unitConfig);
        checked.unit = unitConfig[checked.unitPTR];
        checked.message = "minVal reached";
        return checked;
      }
      //if input is within borders of min/max
      if (minValByte <= inputByte && inputByte <= maxValByte) {
        return checked;
      }
      // jumping to maxVal
      if (inputByte > maxValByte) {
        let maxValUnit = maxVal.match(/[a-z]+/gi).join(""); // extracting unit from maxVal
        checked.number = this.getNumber(maxVal);
        checked.message = "maxVal reached";
        checked.unitPTR = this.unitMatch(maxValUnit, unitConfig);
        checked.unit = unitConfig[checked.unitPTR].unit;
        return checked;
      }
      // jumping to minVal
      if (inputByte < minValByte) {
        let minValUnit = minVal.match(/[a-z]+/gi).join(""); // extracting unit from maxVal
        checked.number = this.getNumber(minVal);
        checked.message = "minVal reached";
        checked.unitPTR = this.unitMatch(minValUnit, unitConfig);
        checked.unit = unitConfig[checked.unitPTR].unit;
        return checked;
      }
      return checked;
    }
    if (unitConfigInUse === "vCPU") {
      // if vCPU is used, e.g. m , vCPU
      let minValCPU = this.convertValuetoCPU(minVal);
      let maxValCPU = this.convertValuetoCPU(maxVal);
      let inputCPU = this.convertValuetoCPU(input + unit);

      if (minValCPU <= inputCPU && maxValCPU >= inputCPU) {
        return checked;
      }

      if (minValCPU < inputCPU) {
        checked.number = this.getNumber(minVal);
        checked.message = "minVal reached";

        minVal = minVal.match(/[a-z]+/gi).join(""); // extracting unit from maxVal

        checked.unit = unitConfig[this.unitMatch(minVal, unitConfig)].unit;
        return checked;
      }

      if (maxValCPU > inputCPU) {
        checked.number = this.getNumber(maxVal);
        checked.message = "maxVal reached";

        maxVal = maxVal.match(/[a-z]+/gi).join(""); // extracting unit from maxVal

        checked.unit = unitConfig[this.unitMatch(maxVal, unitConfig)].unit;
        return checked;
      }
    }
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
  increment(number, unitInUsePTR, unitConfig, minVal, maxVal, unitConfigInUse) {
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
      convertedNumber.unit,
      unitConfig,
      unitConfigInUse
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
  decrement(number, unitInUsePTR, unitConfig, minVal, maxVal, unitConfigInUse) {
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
      convertedNumber.unit,
      unitConfig,
      unitConfigInUse
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
        convertedNumber.number = Math.round(
          convertedNumber.number /
            unitConfig[convertedNumber.unitPTR].convertUpAt
        ); // round 0.00 (2 digits)
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

    let report = { message: " ", isValid: true, unitPTR: 0 };
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
      word = unitConfig[0].unit; // neccessary for checkMinMax
    } else {
      report.message = `recognized unit: ${word}`;
      report.unitPTR = indexOfMatchedUnit;
    }
    checked = this.checkMinMax(
      number,
      minVal,
      maxVal,
      word,
      unitConfig,
      this.props.unitConfigInUse
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
      //this block of code can potentially be removed
      let nullIfNoMatch = `${this.state.value}`.match(/[a-z]+/gi); //produces null if no match
      let unit = nullIfNoMatch
        ? nullIfNoMatch.join() //if theres a match take unit
        : this.props.unitConfig[unitInUsePTR].unit; //if no match get unitInUse
      //-> diese 4 Zeilen ermöglichen Increments auf nur Zahlen

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
    //
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
    if (this.props.onUpdate) {
      console.log(
        isNaN(value),
        this.MemoryUtils.convertValueToBytes(value),
        this.MemoryUtils.convertValueToBytes(value + "mib")
      );
      let newValue;
      newValue =
        value === "" || value === "-"
          ? "-" //if nothing defined or "-"
          : isNaN(value) //is value a string with a unit?
          ? this.MemoryUtils.convertValueToBytes(value) //yes -> convert
          : this.MemoryUtils.convertValueToBytes(value + "mib"); //no? add mib and convert
      // TODO check whether the value should be populated as string or as number (aka bytes) : √
      // if the newValue === '-' -> tbd
      if (this.props.passValueAsNumbersOnly) {
        newValue = `${newValue} byte`;
      }
      this.props.onUpdate(newValue);
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

        <div class="bx--form__helper-text">{this.state.message}</div>
      </div>
    );
    return NumberInput;
  }
}
QInput.propTypes = {
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
};

QInput.defaultProps = {
  minVal: "10 MiB",
  maxVal: "10 tiB",
  unitConfig: Memory,
  unitConfigInUse: "Memory",
  passValueAsNumbersOnly: true,
};

export default QInput;
