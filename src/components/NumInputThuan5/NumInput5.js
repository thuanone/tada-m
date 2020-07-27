import React from 'react';
import { Button } from 'carbon-components-react';



class NumInputForm5 extends React.Component {
    constructor(props) {
        super(props);
        const initialState = {
            value: (props.value ? props.value : `0`),
            unitAssociated: (props.unitAssociated ? props.unitAssociated : ['',]),
            minVal: (props.minVal ? props.minVal : 0),
            maxVal: (props.maxVal ? props.minVal : 100),
            standardStepSizes: (props.standardStepSizes ? props.standardStepSizes : [1,]),
            standardChunks: (props.standardChunks ? props.standardChunks : [10, 100,]),
            unitInUse: (props.unitInUse ? props.unitInUse : 0),
            //errorMessageString, set in valdidate()
            errorMessage: '',
        }
        this.state = {
            value: initialState.value,
            numberValue: 0,
            unit: initialState.unitAssociated[0],
            minVal: initialState.minVal,
            maxVal: initialState.maxVal,
            standardStepSizes: initialState.standardStepSizes,
            standardChunks: initialState.standardChunks,
            unitInUse: initialState.unitInUse,
            //errorMessageString, set in valdidate()
            errorMessage: initialState.errorMessage,
            unitAssociated: initialState.unitAssociated,
            stepSize: initialState.standardStepSizes[0],
        };

        this.handleChange = this.handleChange.bind(this);
        this.onClick = this.onClick.bind(this);
        this.userInputToArray = this.userInputToArray.bind(this);
    }

    getNumber(userInputNumbersAsNumbers) {

        //let fullNumber = Number(userInputNumbersAsNumbers.join(''));
        return;
    }//gets a valid valid array with numbers as its elements and one string as a last element
    //concatenates converted number-strings and returns them as a number

    stringMatchesSomeUnit(String) {
        for (const [index, unit] of this.state.unitAssociated.entries()) {
            console.log(unit, String);
            let computedValue = String.localeCompare(unit);
            //case insensitive comparison of two strings, if equivalent returns 0

            if (computedValue === 0) {
                return (index + 1);
            }//returns truthy only if one element of the array matches with the string
        }
        return false;
    }//matches String to strings in unitAssociated and returns index/false if String matches one unit

    userInputToArray(event) {
        let userInputNumbersAsNumbers = [];//parsed and converted event.array is put here

        var userInput = this.state.value.split(' ');
        //splits string into seperate instances and puts them together in an array called userInput


        for (const e of userInput) {
            if (e !== '') {//this is to avoid converting an empty string to 0 and pushing it onto the array
                let eParsed = Number(e);
                //converting checks if instance is a valid number or nor

                if (isNaN(eParsed)) {
                    eParsed = e;
                }//non-number strings are set back to their original state before being pushed onto the array
                userInputNumbersAsNumbers.push(eParsed);
            }
        }//iterates over seperated strings and converts numericalStrings into a numbertype and sorts them in a new array

        return userInputNumbersAsNumbers;
    }//converts input into an array of numbers and strings and returns said array

    checkFormat(userInputAsArray) {
        //error messages
        let isError = ``;
        let wrongFomatMessage = `wrong Format - please input as 'Value' ${this.state.unitAssociated}`;
        let wrongNumberTypeMessage = `invalid input: please use integers for ${this.state.unitAssociated[0]}`;


        //helpingVariables
        let numberOfStrings = 0;
        let lengthOfInputArray = userInputAsArray.length;
        let lastNumber_Index;
        let lastString_Index;
        let previousString_Index;
        let unitsInUse = new Set();
        let number_Position = [];
        let string_Position = [];



        if (lengthOfInputArray === 1) {
            if (isNaN(userInputAsArray[0])) {
                isError = `input has to start with a number`;
            }
        }//validation for first input

        if (lengthOfInputArray >= 2) {

            if (isNaN(userInputAsArray[0])) {
                isError = `input has to start with a number`
            }//error: first element of input is not a number

            for (const [index, value] of userInputAsArray.entries()) {
                if (!isNaN(value)) {
                    lastNumber_Index = index;
                    number_Position.push(index);

                }//numbers

                else {//strings
                    numberOfStrings += 1;
                    lastString_Index = index;
                    string_Position.push(index);
                    
                    if (numberOfStrings === 1) {
                        previousString_Index = index;
                    }
                    if (numberOfStrings > 1) {
                        if (lastString_Index - previousString_Index < 2) {
                            isError = `successive strings`;
                        }
                        previousString_Index = index;
                    }//error: two strings in succession -> unit + unit

                    let unitAssociatedMatch_IndexIncr = this.stringMatchesSomeUnit(value);
                    //is 0 if value doesnt match a string in unitAssociated
                    //if value matches a unit, returns its index in unitsAssociated

                    if (unitAssociatedMatch_IndexIncr) {
                        if (unitsInUse.has(unitAssociatedMatch_IndexIncr -1)) {
                            isError = `${value} is already used`;
                        } else {
                            unitsInUse.add(unitAssociatedMatch_IndexIncr -1);
                        }
                    }//checks if a unit is used twice 
                    else {
                        isError = `${value} is invalid unit`;
                    }//checks if string is valid unit


                }//strings
            }
        }//iterative validation for arrays equal and greater than 2

        if (isError) {
            this.setState({ errorMessage: isError });

            let reportCard = {
                isValid: false,
                number_Position: number_Position,
                string_Position: string_Position,
            };
            console.log(reportCard);
            return reportCard;
        }

        this.setState({ errorMessage: `` });
        let reportCard = {
            isValid: true,
            number_Position: number_Position,
            string_Position: string_Position,
        }
        //console.log(reportCard);
        return reportCard;
    }

    onClick(string, event) {
        let userInput = this.userInputToArray(event);
        let reportCard = this.checkFormat(userInput);
        if (!reportCard.isValid) {
            return 0;
        }
        let number = this.getNumber(userInput);
        if (string === 'Increment') {
            console.log('Increment');
            //let incrementedNumber = number + this.state.stepSize;
        } else if (string === 'Decrement') {
            console.log('Decrement');
        }
    }

    handleChange(event) {

        let userInput = this.userInputToArray(event);

        let reportCard = this.checkFormat(userInput);
        //console.log(`outside ${reportCard}`);
        this.setState({ value: event.target.value });


    }//should be used in final iteration

    render() {
        return (
            <div>
                <Button onClick={this.onClick} onMouseDown={this.onMouseDown}>
                    hello
                </Button>
                <input type="number"></input>
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
                                                isincrement={true}
                                                onClick={() => this.onClick('Increment')}
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
                                                isincrement={false}
                                                onClick={() => this.onClick('Decrement')}
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

export default NumInputForm5;