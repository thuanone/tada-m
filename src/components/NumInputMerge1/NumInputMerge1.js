import React from 'react'

class NumInputMerge1 extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      //actively used properties
      value: '',
      unitInUsePTR: props.unitInUsePTR ? props.unitInUsePTR : 0,
      message: '',
      isValid: false,

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
    }
    else {
      msg = 'min Value reached'
    }
    this.setState({
      message : msg
    })
    return number
  }

  convert(number,unitInUsePTR,unitRX,Config) {
    let convertedNumber = {
      number : number,
      //unit : unitRX,//UnitRX is String withing Array
      unit: unitRX[0],//thuan 
      unitPTR: unitInUsePTR,
    }
    let unitConfig = Config.unitConfig
    console.log(number,unitInUsePTR,unitRX);
    if (number >= 1024 && unitConfig[unitInUsePTR + 1] != undefined) {
      convertedNumber.number = Math.round(number/1024)
      convertedNumber.unit = unitConfig[unitInUsePTR + 1].unit//{unit:} is assigned to String
      convertedNumber.unitPTR = unitInUsePTR +1


    }
    if (number < 1 && unitConfig[unitInUsePTR - 1] != undefined){
      convertedNumber.number = 1024 - Config.unitConfig[unitInUsePTR-1].standardStepSize
      convertedNumber.unit = unitConfig[unitInUsePTR - 1].unit//{unit:} is assigned to String
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
    for (i = 0; i < Config.length; i++) // Array Size (last one is none)
      if (string.toUpperCase() === Config[i].unit.toUpperCase() || string.toUpperCase() === Config[i].shortUnit.toUpperCase()){
        return i // new unitInUsePTR
    }
    return 'notValid' 
  }

  validate(userInput, Config) {
    const regexNum = /-?[0-9]+/gi
    const regexString = /[a-z]+/gi

    let matchedNum = userInput.match(regexNum)
    let matchedString = userInput.match(regexString)

    let report = {
     message: ' ',
     isValid:true,
     newPTR:'',
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
      report.isValid = false
      return report
    }
    
    let returnUnitMatch = this.unitMatch(matchedString, Config.unitConfig) // either new unitInUsePTR or '' (none)

    if (returnUnitMatch != 'notValid') {
      // checks if the unit comes next
        report.message =  `recognized unit: ${matchedString}`
        report.newPTR = returnUnitMatch


    } else {
      if (matchedString === '') {
     report.message = 'please enter a valid unit'
      } else {
          report.message = `${matchedString} is not a valid unit`
      }
      report.isValid = false
    }

    return report
  }

  onClick(buttonID, unitInUsePTR, Config ) {
    if (!this.state.isValid) {
      return 
    } else {
      const regexString = /[a-z]+/gi
      let unitRX = this.state.value.match(regexString)
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
      console.log(newNumber);
      let returnConverted = this.convert(newNumber,unitInUsePTR,unitRX, Config)

      this.setState({
        value: String(returnConverted.number) + ' ' + returnConverted.unit,
        unitInUsePTR : returnConverted.unitPTR
      })
    }
  }

  onChange(event) {
    let Config = this.Configuration;
    let userInput = event.target.value;
    let report = this.validate(userInput,Config,this.state.unitInUsePTR);
    this.setState({
      value: event.target.value,
      message: report.message,
      isValid: report.isValid,
      unitInUsePTR: report.newPTR ? report.newPTR: this.state.unitInUsePTR,
    });
    console.log('ptr :', this.state.unitInUsePTR)

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
                  placeholder = 'e.g. 1 MiB'
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
          Active Unit: {this.Configuration.unitConfig[this.state.unitInUsePTR].unit}
        </div>

        <div class="bx--form__helper-text">{this.state.message}</div>
      </div>
    )
  }
}

export default NumInputMerge1
