import React from 'react';



class NumInputForm4 extends React.Component {
    constructor(props) {
        super(props);
        const initialState = {
            value: (props.value ? props.value : ``),
            unitAssociated: (props.unitAssociated ? props.unitAssociated : ['',]),
            minVal: (props.minVal ? props.minVal : 0),
            maxVal: (props.maxVal ? props.minVal : 100),
            stepSize: (props.stepSize ? props.stepSize : [1,]),
            uppedUnits: (props.uppedUnits ? props.uppedUnits : [1]),
            //errorMessageString, set in valdidate()
            errorMessage: '',
        }
        this.state = {
            value: initialState.value,
            numberValue: 0,
            unit: initialState.unitAssociated[0],
            minVal: initialState.minVal,
            maxVal: initialState.maxVal,
            stepSize: initialState.stepSize[0],
            uppedUnits: initialState.uppedUnits[0],
            //errorMessageString, set in valdidate()
            errorMessage: initialState.errorMessage,
            unitAssociated: initialState.unitAssociated,
        };
        /* Setzt alle Werte auf undefined -> wahrscheinlich, weil props.xx.y nicht existieren
        this.state={
            value: props.value,
            unit: props.unitAssociated,
            minVal: props.minVal,
            maxVal: props.maxVal,
            stepSize: props.stepSize,
            uppedUnits: props.uppedUnits,
        };
        */

        this.getValue = this.getValue.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.checkValueFormat = this.checkValueFormat.bind(this);
        this.handleState = this.getValue.bind(this);
        this.stringMatchesSomeUnit = this.stringMatchesSomeUnit.bind(this);

        this.numInDecrement = this.numInDecrement.bind(this);
        this.handleButtonClicks = this.handleButtonClicks.bind(this);

    }
    
    handleButtonClicks() {

    }

    numInDecrement (Increment) {
        let stepSize = this.state.stepSize;


        if (Increment) {
            console.log('Increment');
        }
        else {
            console.log('Decrement');
        }
    }

    stringMatchesSomeUnit(String) {
        for (const unit of this.state.unitAssociated) {
            let computedValue = String.localeCompare(unit);
            //case insensitive comparison of two strings, if equivalent returns 0

            if (computedValue === 0) {
                return true;
            }//returns true only if one element of the array matches with the string
        }
        return false;
    }//if no element matches then string is not in array



    getValue(event) {
        let userInputNumbersAsNumbers = [];//parsed and converted event.array is put here

        var userInput = this.state.value.split(' ');
        //splits string into seperate instances and puts them together in an array called userInput


        for (const e of userInput) {
            if (e != '') {//this is to avoid converting an empty string to 0 and pushing it onto the array
                let eParsed = Number(e);
                //converting checks if instance is a valid number or nor

                if (isNaN(eParsed)) {
                    eParsed = e;
                }//non-number strings are set back to their original state before being pushed onto the array
                userInputNumbersAsNumbers.push(eParsed);
            }
        }//iterates over seperated strings and converts numericalStrings into a numbertype and sorts them in a new array

        return userInputNumbersAsNumbers;
    }

    checkValueFormat(userInputNumbersAsNumbers) {

        //errorMessages
        let wrongFormat = ``;
        let wrongFomatMessage = `wrong Format - please input as 'Value' ${this.state.unitAssociated}`;//

        let lengthArray = userInputNumbersAsNumbers.length;
        let numberOfString = 0;


        if (lengthArray === 1) {
            if (isNaN(userInputNumbersAsNumbers[0])) {
                wrongFormat = wrongFomatMessage;
            }
        }//throws error if only input is String
        //missing: if only number then --> please specify unit

        if (lengthArray >= 2) {

            let lastNumber_Index;
            let lastString_Index;

            if (isNaN(userInputNumbersAsNumbers[0])) {
                wrongFormat = wrongFomatMessage;
            }//throws error if first element is not a number


            //Validation for Strings 
            for (const [index, value] of userInputNumbersAsNumbers.entries()) {
                if (!isNaN(value)) {
                    lastNumber_Index = index;
                    if (lastNumber_Index < lastString_Index) {
                        wrongFormat = wrongFomatMessage;
                    }//throws error if number follows after string

                } else {
                    numberOfString += 1;
                    lastString_Index = index;
                    if (!this.stringMatchesSomeUnit(value)) {
                        wrongFormat = wrongFomatMessage;
                    }
                }//counts number of strings

            }//iterates over 
        }
        if (numberOfString > 1) {
            wrongFormat = wrongFomatMessage;
        }//throws error if there is more than 1 string

        if (wrongFormat) {
            this.setState({ errorMessage: wrongFormat });
            return false;
        }//returns false if format not as specified
        else {
            this.setState({errorMessage: ``});
            return true;
        }//returns true no error flag is triggered is as specified and resets errorMessage to ``
        

    }

    handleChange(event) {

        let userInput = this.getValue(event);

        let isValidFormat = this.checkValueFormat(userInput);
        this.setState({ value: event.target.value });


    }//should be used in final iteration

    render() {
        return (
            <div>
                <div>
                    <label>
                        CarbonDesignImport.NumberInput_HTMLCopy
                        <div class="bx--form-item bx--text-input-wrapper">
                            <div class="bx--number bx--number--helpertext">
                                <label class="bx--label"> </label>

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
                                            <button class="bx--number__control-btn up-icon" type="button" title="Increment number"
                                                aria-label="Increment number" aria-live="polite" aria-atomic="true"
                                                
                                                id="incrementButton"
                                                onClick={() => this.numInDecrement(true)}
                                                >
                                                <svg focusable="false" preserveAspectRatio="xMidYMid meet"
                                                    style={{ willChange: "transform" }} xmlns="http://www.w3.org/2000/svg" width="8" height="4" viewBox="0 0 8 4"
                                                    aria-hidden="true" class="up-icon">
                                                    <path d="M0 4l4-4 4 4z"></path>
                                                </svg>
                                            </button>
                                            <button class="bx--number__control-btn down-icon" type="button" title="Decrement number"
                                                aria-label="Decrement number" aria-live="polite" aria-atomic="true"
                                                
                                                id="decrementButton"
                                                onClick={() => this.numInDecrement(false)}
                                                >
                                                <svg focusable="false" preserveAspectRatio="xMidYMid meet"
                                                    style={{ willChange: "transform" }} xmlns="http://www.w3.org/2000/svg" width="8"
                                                    height="4" viewBox="0 0 8 4" aria-hidden="true" class="down-icon">
                                                    <path d="M8 0L4 4 0 0z"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                        <p>Unit: {this.state.unit}</p>
                        <p>{this.state.errorMessage}</p>
                    </label>
                </div>
            </div>
        );
    }
}

export default NumInputForm4;