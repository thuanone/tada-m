import React from "react";
import PropTypes from "prop-types";
import MemoryUtils from "./memory-utils";

import { Memory } from "./units";

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
      unitInUsePTR: props.unitInUsePTR ? props.unitInUsePTR : 0,
      message: "",
      isValid: true,
    };
    this.onChange = this.onChange.bind(this);
    this.onClick = this.onClick.bind(this);
    this.unitMatch = this.unitMatch.bind(this);
    this.validate = this.validate.bind(this);
    this.checkMinMax = this.checkMinMax.bind(this);

    this.MemoryUtils = new MemoryUtils();
  }

  //currently not in use
  onComponentUpdate(prevProps) {
    if (prevProps && prevProps.value !== this.props.value) {
      this.setState({ value: this.props.value });
    }
  }

  componentDidMount() {
    this.populateToParent(this.state.value);
  }

  checkMinMax(input, minVal, maxVal, unit,unitConfig) {
    let checked = {
      number: input,
      message: "",
      unit: unit,
    };
    let minValByte = this.MemoryUtils.convertValueToBytes(minVal);
    let maxValByte = this.MemoryUtils.convertValueToBytes(maxVal);
    let inputByte = this.MemoryUtils.convertValueToBytes(input + unit);

    if (minValByte <= inputByte && inputByte <= maxValByte) {
      return checked;
    }
    // jumping to minVal
    if (inputByte < minValByte) {
      checked.number = this.getNumber(minVal);
      checked.message = "minVal reached";
      return checked;
    }
    // jumping to maxVal
    if (inputByte > maxValByte) {
      checked.number = this.getNumber(maxVal);
      checked.message = "maxVal reached";
      maxVal = maxVal.match(/[a-z]+/gi).join(""); // extracting unit from maxVal
      console.log("maxVal",maxVal)
      checked.unit = unitConfig[this.unitMatch(maxVal,unitConfig)].unit;
      return checked;
    }
  }

  increment(number, unitInUsePTR, unitConfig, minVal, maxVal) {
    let newNumber = {
      number: number,
      message: "",
      unit: unitConfig[unitInUsePTR].unit,
      unitPTR: unitInUsePTR,
    };

    if (number === "-") {
      let unit = unitConfig[this.unitMatch(minVal,unitConfig)].unit;
      return { number: this.getNumber(minVal), unit: unit };
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
    );
    newNumber.unit = convertedNumber.unit;
    newNumber.number = checked.number;
    newNumber.message = checked.message;

    return newNumber;
  }

  decrement(number, unitInUsePTR, unitConfig, minVal, maxVal) {
    let newNumber = {
      number: number,
      message: "",
      unit: unitConfig[unitInUsePTR].unit,
      unitPTR: unitInUsePTR,
    };
    let unit = unitConfig[unitInUsePTR].unit;

    if (number === "-") {
      return { number: 0 };
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
    );
    newNumber.unit = convertedNumber.unit;
    newNumber.number = checked.number;
    newNumber.message = checked.message;

    return newNumber;
  }

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
        console.log('number',convertedNumber.number,'PTR', convertedNumber.unitPTR );
        convertedNumber.number =
          Math.round(
            (convertedNumber.number) / unitConfig[convertedNumber.unitPTR].convertUpAt
          ); // round 0.00 (2 digits)
        convertedNumber.unitPTR = convertedNumber.unitPTR + 1;
      }
      console.log('number',convertedNumber.number,'PTR', convertedNumber.unitPTR );

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
        ? 0 //does not occur because no input has been set to invalid
        : input === "-"
        ? "-"
        : numbersMatch
        ? parseFloat(numbersMatch.join(""))
        : "-";
    return number;
  }

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

  validate(userInput, units, minVal, maxVal) {
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
    console.log("thresholf", parseFloat(matchedNum), minVal, maxVal);
    if (parseFloat(matchedNum) < minVal || parseFloat(matchedNum) > maxVal) {
      report.message = `${matchedNum} is above / below allowed threshhold`;
      report.isValid = false;
      return report;
    }
    returnUnitMatch = this.unitMatch(matchedString, units); // either new unitInUsePTR or 'notValid'

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
  onClick(buttonID, unitInUsePTR) {
    if (!this.state.isValid) {
      return;
    } else {
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
          maxVal
        );
      } else if (buttonID === "Decrement") {
        newNumber = this.decrement(
          number,
          unitInUsePTR,
          this.props.unitConfig,
          minVal,
          maxVal
        );
      }

      this.setState(
        {
          value: newNumber.unit
            ? `${newNumber.number} ${newNumber.unit}`
            : newNumber.number,
          unitInUsePTR: newNumber.unitPTR,
          message: newNumber.message,
        },
        () => {
          this.populateToParent(this.state.value);
        }
      );
    }
  }

  onChange(event) {
    let userInput = event.target.value;
    let report = this.validate(
      userInput,
      this.props.unitConfig,
      this.state.unitInUsePTR,
      this.props.minVal,
      this.props.maxVal
    );
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
        value === ""
          ? "-"
          : isNaN(value)
          ? this.MemoryUtils.convertValueToBytes(value)
          : this.MemoryUtils.convertValueToBytes(value + "mib");
      // TODO check whether the value should be populated as string or as number (aka bytes) : √
      // if the newValue === '-' -> tbd
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
   *
   */
  feedByteAsNumbersOnly: PropTypes.bool,
};

QInput.defaultProps = {
  minVal: "10 MiB",
  maxVal: "10 TiB",
  unitConfig: Memory,
};

export default QInput;
