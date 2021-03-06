import React from "react";

class NumInputMerge extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      //actively used properties
      value: props.value ? props.value : `0`,
      unitInUsePTR: props.unitInUsePTR ? props.unitInUsePTR : 0,
      errorMessage: "",
      isValid: true,

      //static variables which should be accessed through props
      userInputAsArray: [],
    };

    this.handleChange = this.handleChange.bind(this);
    this.onClick = this.onClick.bind(this);

    
    this.stringMatchesSomeUnit = this.stringMatchesSomeUnit.bind(this);
    
    this.checkFormat = this.checkFormat.bind(this);


  }

  /**MATCH_TO_ORIGINAL__onClickOnly
   *
   * this functions takes a number, a bool called newUnit and this.state.value called oldvalue
   * and replaces the numerical value of this.state.value with the newnumber and returns a string in the same format as old value
   * e.g. increment --> (1001, false, '1 000 mb') >> returns '1 001 mb'
   * e.g  increment --> (1001, false, '1000mb') >> returns '1001mb'
   * e.g. increment --> (1, true, '1023 mb') >> should return 1 gb
   * -----------------------------
   * @param {Number} newNumber new value for this.state.value
   * @param {Boolean} newUnit bool for if a conversion has happened in increment()/decrement()
   * @param {String} oldValue this.state.value to copy its format
   * @param {Array} parsedOldValueReversed this.state.value matched with a regex and parsed individually into an array
   * @param {Array} parsedNewValueReversed number parsed into individual string ziffer
   * @param {Array} parsedUnit unit of valid this.state.value parsed as a block into an arrray
   * @param {Number} indexOfOldValue counter for matching logic to recreate oldValues format
   * @param {Array} newValueArrayReversed
   * @param {String} newValue new string to replace this.state.value
   * @return {String} newValue
   */
  matchToOriginal(newNumber, newUnit, oldValue) {
    if (newUnit) {
      return;
    } else {
      //regex
      const numbersAndWhiteSpaceOnly = /-?[0-9]|\s/gi;
      const unit = /[a-z]+/gi;

      let parsedOldValueReversed = oldValue
        .match(numbersAndWhiteSpaceOnly)
        .reverse();
      let parsedNewValueReversed = `${newNumber}`
        .match(numbersAndWhiteSpaceOnly)
        .reverse();
      let parsedUnit = oldValue.match(unit);
      let indexOfOldValue = 0;

      let newValueArrayReversed = [];

      for (const x of parsedNewValueReversed) {
        if (parsedOldValueReversed[indexOfOldValue] === " ") {
          newValueArrayReversed.push(" ");
          indexOfOldValue += 1;
          newValueArrayReversed.push(x);
        } else {
          newValueArrayReversed.push(x);
        }
        indexOfOldValue += 1;
      }
      let newValue = newValueArrayReversed
        .reverse()
        .concat(parsedUnit)
        .join("");

      return newValue;
    }
  }

  /**INCREMENT__onClickOnly
   * receives userInput as an Array and extracts its number from it
   * then creates a new number from the old value plus a standardIncrement or an equivalent in a bigger unit Size
   * returns a tuple with the newValue and a true/false depending on whether or not the newValue is an incremnt or a conversion
   * ------------
   *
   * @param {Array} userInputAsArray : userInput as an Array
   * @param {Number} number : relevant number from userInputAsAnArray
   * @param {Array} newNumber : either an incremented number or number in proportion to its one bigger unit
   * @returns {Array} newNumber : a tuple consisting of the new value and a conversion flag
   *
   */
  increment(number,  unitInUsePTR, allowMultipleUnits, unitList, conversionToBiggerSize, standardStepSizes){
    let newNumber;

    if (allowMultipleUnits) {
      return;
    } //increment latter part
    else {
      if (
        unitInUsePTR < unitList.length &&
        number < conversionToBiggerSize[unitInUsePTR] &&
        number + unitList[unitInUsePTR] >=
          conversionToBiggerSize[unitInUsePTR]
      ) {
        newNumber =
          number % conversionToBiggerSize[unitInUsePTR];
        return [newNumber, true];
      } //checks if number turns from a nonStandardUpperUnit(<1) to a standardUpperUnit(>=), and will convert if so
      else {
        newNumber =
          number + standardStepSizes[unitInUsePTR];
        return [newNumber, false];
      } //if not conversion-ready will simply increment the old value by a standardSized increment
    }
  }

  decrement(number,  unitInUsePTR, allowMultipleUnits, unitList, conversionToBiggerSize, standardStepSizes){
    let newNumber;

    if (allowMultipleUnits) {
      return;
    } 
    else {
      if (
        unitInUsePTR < unitList.length &&
        number < conversionToBiggerSize[unitInUsePTR] &&
        number + unitList[unitInUsePTR] >=
          conversionToBiggerSize[unitInUsePTR]
      ) {
        newNumber =
          number % conversionToBiggerSize[unitInUsePTR];
        return [newNumber, true];
      } 
      else {
        newNumber =
          number - standardStepSizes[unitInUsePTR];
        return [newNumber, false];
      } 
    }
  }

  /**GET_NUMBER
   * this functions gets this.state.value and returns the number inside the string
   * @param {Array} numbersMatch this.state.value's numbers and whitespaces parsed invidually into an Array
   * @param {Array} numberArray numbersAndWhiteSpaceMatch without its whitespaces
   * @param {Number} number number
   * @return {Number} number
   *
   */
  getNumber(value, allowMultipleUnits) {
    if (allowMultipleUnits) {
      // for 1h 20min
      return;
    } else {
      const numbersOnly = /-?[0-9]|/gm;
      let numbersMatch = value.match(numbersOnly);
      //has to be changed to this.state.value later on, onClick function only

      if (numbersMatch === null) {
        return 0;
      }
      let number = numbersMatch.join("");
      return Number(number);
    }
  }

  /**STRING_MATCHES_SOME_UNIT
   * this function takes a string and checks whether or not it is a valid unit in unitList
   * -----------------
   * @param {String} string String to be tested if its a string
   * @param {Number} computedValue result of String.prototype.localeCompare() [0:equivalent, -1/+1: ineuqivalent]
   */
  stringMatchesSomeUnit(string) {
    for (const [index, unit] of this.props.unitList.entries()) {
      let computedValue = string.localeCompare(unit);
      //case insensitive comparison of two strings, if equivalent returns 0

      if (computedValue === 0) {
        return index + 1;
      } //returns truthy only if one element of the array matches with the string
    }
    return false;
  }

  /**USER_INPUT_TO_ARRAY
   * This function receives a String and returns its contents separated into letters and numbers as an Array
   * excluding anything else like whitespaces or dots/commas etc.
   * ---------------
   * @param {String} userInput here: passed in is this.state.value
   * @param {Array} userInputAsArrayStrings
   * @param {Array} userInputAsAnArray
   * @returns {Array} userInputAsArray input string is returned seperated in (non decimal) numbers, strings and whitespaces
   */
  userInputToArray(userInput /*this.state.value*/) {
    const regex = /[a-z]+|[0-9]+|\s/gi;

    if (userInput === "") {
      return [];
    } //if this.state.value is an empty string >> emtpy array is returned
    //else match returns null

    let userInputAsArrayStrings = userInput.match(regex);
    let userInputAsArray = [];

    if (userInputAsArrayStrings === null) {
      return [];
    }

    for (const e of userInputAsArrayStrings) {
      if (e !== " ") {
        //this is to avoid converting an empty string to 0 and pushing it onto the array
        let eParsed = Number(e);
        //converting checks if instance is a valid number or nor

        if (isNaN(eParsed)) {
          eParsed = e;
        } //non-number strings are set back to their original state before being pushed onto the array
        userInputAsArray.push(eParsed);
      }
    } //iterates over seperated strings and converts numericalStrings into a numbertype and sorts them in a new array
    console.log(userInputAsArrayStrings, userInputAsArray);
    return userInputAsArray;
  }

  checkFormat(userInputAsArray) {
    //error messagess
    let isError = ``;
    //let wrongFomatMessage = `wrong Format - please input as 'Value' ${this.state.unitList}`;
    //let wrongNumberTypeMessage = `invalid input: please use integers for ${this.state.unitList[0]}`;

    //helpingVariables
    let numberOfStrings = 0;
    let lengthOfInputArray = userInputAsArray.length;
    let lastNumber_Index;
    let lastString_Index;
    let previousString_Index;
    let unitsInUse = [];
    let number_Position = [];
    let string_Position = [];
    let reportCard = {
      isValid: true,
      errorMessage: "",
    };

    if (lengthOfInputArray === 1) {
      if (isNaN(userInputAsArray[0])) {
        isError = `input has to start with a number`;
      } else {
        const [[index, value]] = userInputAsArray.entries();
        number_Position.push(index);
      }
    } //validation for first input

    if (lengthOfInputArray >= 2) {
      if (isNaN(userInputAsArray[0])) {
        isError = `input has to start with a number`;
      } //error: first element of input is not a number

      for (const [index, value] of userInputAsArray.entries()) {
        if (!isNaN(value)) {
          //numbers
          lastNumber_Index = index;
          number_Position.push(index);

          if (
            !this.state.allowMultipleUnits &&
            lastNumber_Index > lastString_Index
          ) {
            isError = `please use only one unit`;
          } //error if only 1 unit: 10 unit 10;;
          //two errors bundled in one
        } else {
          //strings
          numberOfStrings += 1;
          lastString_Index = index;
          string_Position.push(index);

          let unitListMatch_IndexIsIncremented = this.stringMatchesSomeUnit(
            value
          );
          //is 0 if value doesnt match a string in unitList
          //if value matches a unit, returns its index in unitsAssociated

          if (numberOfStrings === 1) {
            previousString_Index = index;

            if (
              lengthOfInputArray > 1 &&
              unitListMatch_IndexIsIncremented - 1 === 0 &&
              !Number.isInteger(userInputAsArray[lastNumber_Index])
            ) {
              isError = `please use non-decimals with ${
                this.state.unitList[this.state.unitInUsePTR]
              }`;
            } //error: decimal is used with most simplest unit - unitList[0]
          }

          if (this.state.allowMultipleUnits === true && numberOfStrings > 1) {
            if (lastString_Index - previousString_Index < 2) {
              isError = `successive strings`;
            }
            previousString_Index = index;
          } //error if allowed multiple units: two strings in succession -> unit + unit
          else if (
            this.state.allowMultipleUnits === false &&
            numberOfStrings > 1
          ) {
            isError = `please use one unit only`;
          } //error if only 1 unit: multiple strings detected

          if (unitListMatch_IndexIsIncremented) {
            let unitListMatch_Index = unitListMatch_IndexIsIncremented - 1;
            if (unitsInUse.includes(unitListMatch_Index)) {
              isError = `${value} is already used`;
            } //error: unit has been used already
            else {
              // if not pushed index onto array
              unitsInUse.push(unitListMatch_Index);
              if (
                this.state.allowMultipleUnits &&
                unitsInUse.length > 1 &&
                unitsInUse[numberOfStrings - 2] < unitListMatch_Index
              ) {
                isError = `please specify bigger units first`;
              } //error format: 10 small unit big unit
            }
          } else {
            isError = `${value} is invalid unit`;
          } //checks if string is valid unit
        } //strings
      }
    } //iterative validation for arrays equal and greater than 2

    if (isError) {
      reportCard.isValid = false;
      reportCard.errorMessage = isError;
      return reportCard;
    } else {
      reportCard.isValid = true;
      reportCard.errorMessage = "";
      return reportCard;
    }
  }

  onClick(buttonID) {
    
    if (!this.state.isValid) {
      return;
    } //throws error for invalid input format and doesnt change input value
    else {
      let number = this.getNumber(this.state.value, this.props.allowMultipleUnits);
      let newNumber = [];
      let newValue;

      if (buttonID === "Increment") {
        newNumber = this.increment(
            number,
            this.state.unitInUsePTR,

            this.props.allowMultipleUnits,
            this.props.unitList,
            this.props.conversionToBiggerSize,
            this.props.standardStepSizes
        );
        newValue = this.matchToOriginal(
          newNumber[0],
          newNumber[1],
          this.state.value
        );
      } //Increment
      else if (buttonID === "Decrement") {
        newNumber = this.decrement(
          number,
            this.state.unitInUsePTR,

            this.props.allowMultipleUnits,
            this.props.unitList,
            this.props.conversionToBiggerSize,
            this.props.standardStepSizes
        );
        newValue = this.matchToOriginal(
          newNumber[0],
          newNumber[1],
          this.state.value
        );
      } //Decrement

      this.setState({
        value: newValue,
      });
    }
  }

  handleChange(event) {
    let userInput = event.target.value;
    let userInputAsArray = this.userInputToArray(userInput);
    let reportCard = this.checkFormat(userInputAsArray);

    this.setState({
      value: event.target.value,
      isValid: reportCard.isValid,
      errorMessage: reportCard.errorMessage,
    });
  } //should be used in final iteration

  render() {
    return (
      <div>
        <label class="bx--label">NumInputMerge v1</label>

        <div class="bx--form-item bx--text-input-wrapper">
          <div class="bx--number bx--number--helpertext">
            <div class="bx--text-input__field-outer-wrapper">
              <div class="bx--text-input__field-wrapper">
                <input
                  class="bx--text-input bx--text__input"
                  type="text"
                  aria-label="Numeric input field with increment and decrement buttons"
                  value={this.state.value}
                  onChange={this.handleChange}
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
                    onMouseDown={() => this.onClick("Increment")}
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
                    onClick={() => this.onClick("Decrement")}
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
          Unit: {this.props.unitList[this.state.unitInUsePTR]}
        </div>

        <div class="bx--form__helper-text">{this.state.errorMessage}</div>
      </div>
    );
  }
}

export default NumInputMerge;
