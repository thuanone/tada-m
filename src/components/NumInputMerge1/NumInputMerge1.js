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
    
      let NewNumber = (number) + (standardStepSizes[unitInUsePTR])
      return (NewNumber)
  }

  decrement(number, unitInUsePTR, standardStepSizes) {

      let NewNumber = number - standardStepSizes[unitInUsePTR]
      return (NewNumber)
  }
  convert(number, unitInUsePTR,conversionToBiggerSize){
    if (unitInUsePTR < conversionToBiggerSize.length -1 ){
      if (number === conversionToBiggerSize[unitInUsePTR]){
        unitInUsePTR =+ 1
        number = conversionToBiggerSize[unitInUsePTR]
        return [number, 1]
      }
    }
    /*
    if (unitInUsePTR > 0){
      if (number < 1){
        unitInUsePTR =- 1
        console.log(this.unitInUsePTR)
        console.log(conversionToBiggerSize[unitInUsePTR])
        number = parseFloat(conversionToBiggerSize[unitInUsePTR]) -1
        return [number, -1]
      }
    }
    */
   
    /*
    if (Math.floor(number/1024) >=1){
      number = conversionToBiggerSize[unitInUsePTR+1]
      return number
    }*/
    
    return [number, false]
  }

  getNumber(value) {

      const numbersOnly = /-?[0-9]|./gm
      let numbersMatch = value.match(numbersOnly)

      if (numbersMatch === null) {
        return 0
      }
      let number = numbersMatch.join('')
      return parseFloat(number) 
  }

  unitMatch(string,unitList) {
    for (const [index, unit] of unitList.entries()) {
      if (string.toUpperCase().localeCompare(unit) === 0) { //case insensitive comparison of two strings, if equivalent returns 0
        return true
      } //returns truthy only if one element of the array matches with the string
    }
    return false
  }

  validate(userInput,unitList) {
    const regexNum = /-?[0-9]+/gi;
    const regexString = /[a-z]+/gi;

    let matchedNum = (userInput.match(regexNum))
    let matchedString = (userInput.match(regexString))

    if (matchedNum !==  null){
      matchedNum = matchedNum.join('');
    }else{
      matchedNum = ''
    }

    if (matchedString !== null){
      matchedString = matchedString.join("");
    }else{
      matchedString = ''
    }
    
    if (!isNaN( parseFloat(matchedNum) ) ){ // Checks if a number comes first

      if (this.unitMatch(matchedString,unitList)){ // checks if the unit comes next
        this.setState({errorMessage:'recognized unit: '+ matchedString, unitInUsePTR: unitList.indexOf(matchedString)})
      }
      else{
        if (matchedString===''){
          this.setState({errorMessage:'please enter a valid unit'})
        }
        else{
          this.setState({errorMessage: matchedString + ' is not a valid unit'})
        } 
      }
    }else{
      this.setState({errorMessage:matchedNum + ' is not a valid number'})
    }
  }

  onClick(buttonID,unitList,unitInUsePTR, conversionToBiggerSize){
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
      let changePTR;
      let returnConvert = this.convert(newNumber, unitInUsePTR,conversionToBiggerSize)
      newNumber =  returnConvert[0]
      changePTR = returnConvert[1]
      this.setState({unitInUsePTR: unitInUsePTR + changePTR })
      

      this.setState({
        value: String(newNumber) + ' ' + unitList[unitInUsePTR+ changePTR]
      })
    }
  }

  onChange(event) {
    let userInput = event.target.value;
    this.validate(userInput,this.props.unitList);
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
                    onMouseDown={() => this.onClick('Increment',this.props.unitList,this.state.unitInUsePTR, this.props.conversionToBiggerSize)}
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
                    onClick={() => this.onClick('Decrement',this.props.unitList,this.state.unitInUsePTR,this.props.conversionToBiggerSize)}
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
          Active Unit: {this.props.unitList[this.state.unitInUsePTR]}
        </div>

        <div class="bx--form__helper-text">{this.state.errorMessage}</div>
      </div>
    )
  }
}

export default NumInputMerge1
