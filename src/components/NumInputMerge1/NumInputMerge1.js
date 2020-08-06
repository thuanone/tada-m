import React from 'react'

class NumInputMerge1 extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      //actively used properties
      value: props.value ? props.value : `0`,
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
  }
  increment(number, unitInUsePTR, standardStepSizes) {
    
      let NewNumber = number + standardStepSizes[unitInUsePTR]
      return NewNumber
  }

  decrement(number, unitInUsePTR, standardStepSizes) {

      let NewNumber = number - standardStepSizes[unitInUsePTR]
      return NewNumber
  }

  getNumber(value) {

      const numbersOnly = /-?[0-9]|/gm
      let numbersMatch = value.match(numbersOnly)

      if (numbersMatch === null) {
        return 0
      }
      let number = numbersMatch.join('')
      return Number(number) 
  }

  unitMatch(string,unitList) {
    for (const [index, unit] of unitList.entries()) {
      if (string.localeCompare(unit) === 0) { //case insensitive comparison of two strings, if equivalent returns 0
        return true
      } //returns truthy only if one element of the array matches with the string
    }
    return false
  }

  validate(userInputAsArray) {
    let validate;
  }

  onClick(buttonID) {
    if (!this.state.isValid) {
      return
    } else {
      let number = this.getNumber(this.state.value);
      let newNumber;

      if (buttonID === 'Increment') {
        newNumber = this.increment(
          number,
          this.state.unitInUsePTR,
          this.props.standardStepSizes,
        )
      } else if (buttonID === 'Decrement') {
        newNumber = this.decrement(
          number,
          this.state.unitInUsePTR,
          this.props.standardStepSizes,
        )
      }

      this.setState({
        value: String(newNumber)
      })
    }
  }

  onChange(event) {
    let userInput = event.target.value
    this.setState({
      value: event.target.value,
    })
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
                    onMouseDown={() => this.onClick('Increment')}
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
                    onClick={() => this.onClick('Decrement')}
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
          Unit: {this.props.unitList[this.state.unitInUsePTR]}
        </div>

        <div class="bx--form__helper-text">{this.state.errorMessage}</div>
      </div>
    )
  }
}

export default NumInputMerge1
