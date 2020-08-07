import React from 'react'

class NumInputMerge1 extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      //actively used properties
      value: '0',
      unitInUsePTR: props.unitInUsePTR ? props.unitInUsePTR : 0,
      errorMessage: '',
      isValid: true,

      //static variables which should be accessed through props
      userInputAsArray: [],
    }

    this.onChange = this.onChange.bind(this)
    this.onClick = this.onClick.bind(this)
    this.unitMatch = this.unitMatch.bind(this)
    this.validate = this.validate.bind(this)
    this.ConfigUnits = this.props;
  }
  increment(number, standardStepSize) {
    let NewNumber = number + standardStepSize
    return NewNumber
  }

  decrement(number, standardStepSize) {
    let NewNumber = number - standardStepSize
    return NewNumber
  }
  convert(number,unitInUsePTR,unitSpecs) {
    let convertedNumber = {
      number : number,
      unit : unitSpecs[unitInUsePTR].unit,
      unitPTR: unitInUsePTR,
    }
    
    if (number >= 1024) {
      convertedNumber.number = Math.round(number/1024)
      convertedNumber.unit = unitSpecs[unitInUsePTR + 1].unit
      convertedNumber.unitPTR = unitInUsePTR +1

    }
    if (number < 1){
      convertedNumber.number = 1024 -1 /*unitSpecs[unitInUsePTR-1].standardStepSizes*/
      convertedNumber.unit = unitSpecs[unitInUsePTR - 1].unit
      convertedNumber.unitPTR = unitInUsePTR - 1
      console.log('CN: ', convertedNumber.number)

    }
    return convertedNumber 

  }

  getNumber(input) {
    const numbersOnly = /-?[0-9]|./gm
    let numbersMatch = input.match(numbersOnly)

    if (numbersMatch === null) {
      return 0
    }
    let number = numbersMatch.join('')
    return parseFloat(number)
  }

  unitMatch(string, ConfigU) {
    var i;
    console.log('len: ', ConfigU)
    for (i = 0; i < ConfigU.length; i++)
      if (string.toUpperCase() === ConfigU[i].unit.toUpperCase){
        return true
    }
    return false
  }

  validate(userInput, ConfigU) {
    const regexNum = /-?[0-9]+/gi
    const regexString = /[a-z]+/gi

    let matchedNum = userInput.match(regexNum)
    let matchedString = userInput.match(regexString)

    if (matchedNum !== null) {
      matchedNum = matchedNum.join('')
    } else {
      matchedNum = ''
    }

    if (matchedString !== null) {
      matchedString = matchedString.join('')
    } else {
      matchedString = ''
    }

    if (isNaN(parseFloat(matchedNum))) {
      // Checks if a number comes first
      this.setState({ errorMessage: matchedNum + ' is not a valid number' })
      return
    }
    if (this.unitMatch(matchedString, ConfigU)) {
      // checks if the unit comes next
      this.setState({
        errorMessage: `recognized unit: ${matchedString}`,
        /* unitInUsePTR: unitInUsePTR */ // CHANGE !!!!!!!
      })
    } else {
      if (matchedString === '') {
        this.setState({ errorMessage: 'please enter a valid unit' })
      } else {
        this.setState({
          errorMessage: matchedString + ' is not a valid unit',
        })
      }
    }

    //seState in onChange object übergeben
  }

  onClick(buttonID, unitInUsePTR, ConfigU ) {
    if (!this.state.isValid) {
      return
    } else {
      let number = this.getNumber(this.state.value)
      let newNumber

      if (buttonID === 'Increment') {
        newNumber = this.increment(
          number,
          ConfigU[unitInUsePTR].standardStepSize,
        )
      } else if (buttonID === 'Decrement') {
        newNumber = this.decrement(
          number,
          ConfigU[unitInUsePTR].standardStepSize,
        )
      }
      let returnConverted = this.convert(newNumber,unitInUsePTR,ConfigU)

      this.setState({
        value: String(returnConverted.number) + ' ' + returnConverted.unit,
        unitInUsePTR : returnConverted.unitPTR
      })
    }
  }

  onChange(event) {
    let ConfigU = this.ConfigUnits;
    let userInput = event.target.value;
    this.validate(userInput,ConfigU);
    this.setState({
      value: event.target.value,
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
                        'Increment',
                        this.state.unitInUsePTR,
                        this.ConfigUnits,
                      )
                    }
                  >
                    <svg
                      focusable="false"
                      preserveAspectRatio="xMidYMid meet"
                      style={{ willChange: 'transform' }}
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
                        'Decrement',
                        this.state.unitInUsePTR,
                        this.ConfigUnits,
                      )
                    }
                  >
                    <svg
                      focusable="false"
                      preserveAspectRatio="xMidYMid meet"
                      style={{ willChange: 'transform' }}
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
          Active Unit: {this.ConfigUnits[this.state.unitInUsePTR].unit}
        </div>

        <div class="bx--form__helper-text">{this.state.errorMessage}</div>
      </div>
    )
  }
}

export default NumInputMerge1
