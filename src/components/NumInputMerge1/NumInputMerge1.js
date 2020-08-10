import React from 'react'

class NumInputMerge1 extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      //actively used properties
      value: '0',
      unitInUsePTR: props.unitInUsePTR ? props.unitInUsePTR : 0,
      message: '',
      isValid: true,

      //static variables which should be accessed through props
      userInputAsArray: [],
    }

    this.onChange = this.onChange.bind(this)
    this.onClick = this.onClick.bind(this)
    this.unitMatch = this.unitMatch.bind(this)
    this.validate = this.validate.bind(this)
    /*
    this.ConfigBase = this.props.general // Base Config e.g. min/max Value
    this.Confignits = this.props.unitSpec // Units e.g. MiB -> stepsize , GiB -> stepsize
    */

    this.Configuration = this.props;
    
  }
  increment(number, unitInUsePTR, Config) {
    let stepsize = Config.unitConfig[unitInUsePTR].standardStepSize

    number = number + stepsize

    // if (number + stepsize <= Config.maxVal){  } use when maxVal is defined
    this.setState({
      message : ''
    })
    return number
  }

  decrement(number, unitInUsePTR, Config) {
    let stepsize = Config.unitConfig[unitInUsePTR].standardStepSize;
    let msg;

    if (number - stepsize >= Config.general.minVal){
      number = number - stepsize
      msg = ''
    }
    else {
      msg = 'min Value reached'
    }
    this.setState({
      message : msg
    })
    return number
  }
  convert(number,unitInUsePTR,Config) {
    let convertedNumber = {
      number : number,
      unit : Config.unitConfig[unitInUsePTR].unit,
      unitPTR: unitInUsePTR,
    }
    let unitConfig = Config.unitConfig
    
    if (number >= 1024 && unitConfig[unitInUsePTR + 1] != undefined) {
      convertedNumber.number = Math.round(number/1024)
      convertedNumber.unit = unitConfig[unitInUsePTR + 1].unit
      convertedNumber.unitPTR = unitInUsePTR +1


    }
    if (number < 1 && unitConfig[unitInUsePTR - 1] != undefined){
      convertedNumber.number = 1024 -1 /*unitSpecs[unitInUsePTR-1].standardStepSizes*/
      convertedNumber.unit = unitConfig[unitInUsePTR - 1].unit
      convertedNumber.unitPTR = unitInUsePTR - 1


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

  unitMatch(string, Config) {
    var i;
    for (i = 0; i < Config.length; i++) // Array Size 
      if (string.toUpperCase() === Config[i].unit.toUpperCase() || string.toUpperCase() === Config[i].shortUnit.toUpperCase()){
        return true
    }
    return false
  }

  validate(userInput, Config) {
    const regexNum = /-?[0-9]+/gi
    const regexString = /[a-z]+/gi

    let matchedNum = userInput.match(regexNum)
    let matchedString = userInput.match(regexString)

    let report = {
     message: ' ',
     changePTR: 0,
    }


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
      report.message =  `${matchedNum}  is not a valid number`
      return report
    }

    if (this.unitMatch(matchedString, Config.unitConfig)) {
      // checks if the unit comes next
        report.message =  `recognized unit: ${matchedString}`
        //report.changePTR = ??

    } else {
      if (matchedString === '') {
     report.message = 'please enter a valid unit'
      } else {
          report.message = `${matchedString} is not a valid unit`
      }
    }

    return report
  }

  onClick(buttonID, unitInUsePTR, Config ) {
    if (!this.state.isValid) {
      return 
    } else {
      let number = this.getNumber(this.state.value)
      let newNumber

      if (buttonID === 'Increment') {
        newNumber = this.increment(
          number,
          unitInUsePTR,
          Config,
        )
      } else if (buttonID === 'Decrement') {
        newNumber = this.decrement(
          number,
          unitInUsePTR,
          Config,
        )
      }
      let returnConverted = this.convert(newNumber,unitInUsePTR,Config)

      this.setState({
        value: String(returnConverted.number) + ' ' + returnConverted.unit,
        unitInUsePTR : returnConverted.unitPTR
      })
    }
  }

  onChange(event) {
    let Config = this.Confignits;
    let userInput = event.target.value;
    let report = this.validate(userInput,Config);
    this.setState({
      value: event.target.value,
      message: report.message,
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
                        this.Configuration,
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
                        this.Configuration,
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
          Active Unit: {/*this.Confignits[this.state.unitInUsePTR].unit*/}
        </div>

        <div class="bx--form__helper-text">{this.state.message}</div>
      </div>
    )
  }
}

export default NumInputMerge1
