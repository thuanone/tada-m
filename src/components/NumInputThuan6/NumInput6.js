import React from 'react';
import { Button } from 'carbon-components-react';

/*
const time_Unit = {
    value: `0`,
    unitAssociated: ['s', 'min', 'h', 'day/s', 'week/s'],
    conversionRate: [1, 60, 3600, 86400, 604800],
    minVal: 1,
    maxVal: undefined,
    standardStepSizes: [1, 1, 1, 1, 1],
    standardChunks: [10, 10, 1, 1, 4],//chosen arbitrarily
    hj
}
*/

class NumInputForm6 extends React.Component {
    constructor(props) {
        super(props);
        const initialState = {
            //actively used properties 
            value: (props.value ? props.value : `0`),
            unitInUsePTR: (props.unitInUsePTR ? props.unitInUsePTR : 0),
            errorMessage: '',

            //static variables which should be accessed through props
            unitAssociated: (props.unitAssociated ? props.unitAssociated : ['',]),
            minVal: (props.minVal ? props.minVal : 0),
            maxVal: (props.maxVal ? props.minVal : 100),
            standardStepSizes: (props.standardStepSizes ? props.standardStepSizes : [1,]),
            standardChunks: (props.standardChunks ? props.standardChunks : [1, 10,]),
            allowMultipleUnits: (props.allowMultipleUnits ? props.allowMultipleUnits : false),
            conversionToBiggerSize: (props.conversionToBiggerSize ? props.conversionToBiggerSize : [1,]),


            //errorMessageString, set in valdidate()
        }
        this.state = {
            value: initialState.value,
            unitInUsePTR: initialState.unitInUsePTR,
            errorMessage: initialState.errorMessage,

            //toBe abolished
            unitAssociated: initialState.unitAssociated,
            minVal: initialState.minVal,
            maxVal: initialState.maxVal,
            standardStepSizes: initialState.standardStepSizes,
            standardChunks: initialState.standardChunks,

            allowMultipleUnits: initialState.allowMultipleUnits,
            conversionToBiggerSize: initialState.conversionToBiggerSize,
            userInputAsArray: [],


            //errorMessageString, set in valdidate()
            //unitInUse: initialState.unitAssociated[initialState.unitInUsePTR],


            reportCard: {
                isValid: true,
                number_Position: [],
                string_Position: [],
                userInputAsArray: [],
            },
        };

        this.handleChange = this.handleChange.bind(this);
        this.onClick = this.onClick.bind(this);

        this.userInputToArray = this.userInputToArray.bind(this);
        this.stringMatchesSomeUnit = this.stringMatchesSomeUnit.bind(this);
        this.getNumber = this.getNumber.bind(this);
        this.checkFormat = this.checkFormat.bind(this);

        this.increment = this.increment.bind(this);
        this.decrement = this.decrement.bind(this);
        this.matchToOriginal = this.matchToOriginal.bind(this);

    }

    componentDidMount = () => {
        let userInputAsArray = this.userInputToArray(this.state.value);
        this.checkFormat(userInputAsArray);
        //checkForm
        //
    }

    matchToOriginal(newNumber, newUnit, oldValue) {
        if (newUnit) {
            return;
        }
        else {
            const numbersAndWhiteSpaceOnly = /[0-9]|\s/gi;
            const unit = /[a-z]+/gi;
            let parsedOldValueReversed = oldValue.match(numbersAndWhiteSpaceOnly).reverse();
            let parsedNewValueReversed = `${newNumber}`.match(numbersAndWhiteSpaceOnly).reverse();
            let parsedUnit = oldValue.match(unit);
            
            let indexOfOldValue = 0;
            let newValueArrayReversed = []
            for (const x of parsedOldValueReversed) {
                if (parsedOldValueReversed[indexOfOldValue] === ' ') {
                    newValueArrayReversed.push(' ');
                    newValueArrayReversed.push(x);
                } else {
                    newValueArrayReversed.push(x);
                }
                indexOfOldValue +=1;
            }


        }
        const regex = /[a-z]+|[0-9]+|\s/gi;
        let parsed = this.state.value.match(regex);
        let arrayNewNumber = Array.from(`${newNumber}`);
        

    }

    increment(userInputAsArray) {
        let number = this.getNumber(userInputAsArray);
        let newNumber;

        if (this.props.allowMultipleUnits) {
            return;
        }//increment latter part 
        else {
            if (
                this.state.unitInUsePTR < this.props.unitAssociated.length &&
                number < this.props.conversionToBiggerSize[this.state.unitInUsePTR] &&
                number + this.props.unitAssociated[this.state.unitInUsePTR] >= this.props.conversionToBiggerSize[this.state.unitInUsePTR]
            ) {
                newNumber = number % this.props.conversionToBiggerSize[this.state.unitInUsePTR];
                return [newNumber, true];
            }//checks if number turns from a nonStandardUpperUnit(<1) to a standardUpperUnit(>=), and will convert if so
            else {
                newNumber = number + this.props.unitAssociated[this.state.unitInUsePTR];
                return [newNumber, false];
            }//if not conversion-ready will simply increment the old value by a standardSized increment
        }
    }/**
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

    decrement() {
        return;
    }

    getNumber() {

    }

    stringMatchesSomeUnit() {
    }

    userInputToArray(userInput/*this.state.value*/) {
        const regex = /[a-z]+|[0-9]+|/gi;

        if (userInput === '') {
            return [];
        }//if this.state.value is an empty string >> emtpy array is returned
        //else match returns null

        let userInputAsArray = userInput.match(regex);
        return userInputAsArray;
    }/**
     * This function receives a String and returns its contents separated into letters and numbers as an Array
     * excluding anything else like whitespaces or dots/commas etc.
     * ---------------
     * @param {String} userInput here: passed in is this.state.value 
     * @returns {Array} userInputAsArray input string is returned seperated in (non decimal) numbers, strings and whitespaces
     */

    checkFormat(userInputAsArray) {
        //error messages
        let isError = ``;
        //let wrongFomatMessage = `wrong Format - please input as 'Value' ${this.state.unitAssociated}`;
        //let wrongNumberTypeMessage = `invalid input: please use integers for ${this.state.unitAssociated[0]}`;


        //console.log(userInputAsArray);

        //helpingVariables
        let numberOfStrings = 0;
        let lengthOfInputArray = userInputAsArray.length;
        let lastNumber_Index;
        let lastString_Index;
        let previousString_Index;
        let unitsInUse = [];
        let number_Position = [];
        let string_Position = [];




        if (lengthOfInputArray === 1) {
            if (isNaN(userInputAsArray[0])) {
                isError = `input has to start with a number`;
            }

            else {
                const [[index, value]] = userInputAsArray.entries();
                number_Position.push(index);
            }

        }//validation for first input

        if (lengthOfInputArray >= 2) {

            if (isNaN(userInputAsArray[0])) {
                isError = `input has to start with a number`
            }//error: first element of input is not a number

            for (const [index, value] of userInputAsArray.entries()) {
                if (!isNaN(value)) {//numbers
                    lastNumber_Index = index;
                    number_Position.push(index);

                    if (!this.state.allowMultipleUnits && lastNumber_Index > lastString_Index) {
                        isError = `please use only one unit`;
                    }//error if only 1 unit: 10 unit 10;;
                    //two errors bundled in one
                }

                else {//strings
                    numberOfStrings += 1;
                    lastString_Index = index;
                    string_Position.push(index);

                    let unitAssociatedMatch_IndexIsIncremented = this.stringMatchesSomeUnit(value);
                    //is 0 if value doesnt match a string in unitAssociated
                    //if value matches a unit, returns its index in unitsAssociated

                    if (numberOfStrings === 1) {
                        previousString_Index = index;

                        if (
                            lengthOfInputArray > 1 &&
                            unitAssociatedMatch_IndexIsIncremented - 1 === 0 &&
                            !Number.isInteger(userInputAsArray[lastNumber_Index])
                        ) {
                            isError = `please use non-decimals with ${this.state.unitAssociated[this.state.unitInUsePTR]}`
                        }//error: decimal is used with most simplest unit - unitAssociated[0]
                    }

                    if (this.state.allowMultipleUnits === true && numberOfStrings > 1) {
                        if (lastString_Index - previousString_Index < 2) {
                            isError = `successive strings`;
                        }
                        previousString_Index = index;
                    }//error if allowed multiple units: two strings in succession -> unit + unit
                    else if (this.state.allowMultipleUnits === false && numberOfStrings > 1) {
                        isError = `please use one unit only`
                    }//error if only 1 unit: multiple strings detected


                    if (unitAssociatedMatch_IndexIsIncremented) {
                        let unitAssociatedMatch_Index = unitAssociatedMatch_IndexIsIncremented - 1;
                        if (unitsInUse.includes(unitAssociatedMatch_Index)) {
                            isError = `${value} is already used`;
                        }//error: unit has been used already 
                        else {// if not pushed index onto array
                            unitsInUse.push(unitAssociatedMatch_Index);
                            if (
                                this.state.allowMultipleUnits &&
                                unitsInUse.length > 1 &&
                                unitsInUse[numberOfStrings - 2] < unitAssociatedMatch_Index
                            ) {
                                isError = `please specify bigger units first`;
                            }//error format: 10 small unit big unit  
                        }
                    }
                    else {
                        isError = `${value} is invalid unit`;
                    }//checks if string is valid unit


                }//strings
            }
        }//iterative validation for arrays equal and greater than 2

        if (isError) {
            this.setState(
                {
                    errorMessage: isError,
                    reportCard: {
                        isValid: false,
                        number_Position: number_Position,
                        string_Position: string_Position,
                        userInputAsArray: userInputAsArray,
                    }
                }
            );
            return false;
        }

        this.setState(
            {
                errorMessage: ``,
                reportCard: {
                    isValid: true,
                    number_Position: number_Position,
                    string_Position: string_Position,
                    userInputAsArray: userInputAsArray,
                }
            }
        );
        return true;
    }

    onClick(buttonID) {

        let userInputAsArray = this.userInputToArray(this.state.value);//parse userInput into an Array
        console.log(this.state.value);
        let reportCard = this.checkFormat(userInputAsArray);//check input if it it is valid and returns a report 

        if (!reportCard.isValid) {
            this.setState({ errorMessage: 'input format invalid' });
            return;
        }//throws error for invalid input format and doesnt change input value 
        else {
            let newNumber = [];
            let newValue;


            if (buttonID === 'Increment') {
                newNumber = this.increment(userInputAsArray, this.state.value);
                newValue = this.matchToOriginal(newNumber[0], newNumber[1], this.state.value);
            }//Increment
            else if (buttonID === 'Decrement') {
                newNumber = this.decrement(userInputAsArray, this.state.value);
                newValue = this.matchToOriginal(newNumber[0], newNumber[1], this.state.value);
            }//Decrement

            this.setState(
                {
                    value: newValue,
                    reportCard: reportCard,
                }
            );
        }
    }

    handleChange(event) {

        let userInput = event.target.value;


        let userInputAsArray = this.userInputToArray(userInput);
        this.checkFormat(userInputAsArray);
        
        this.setState({
            value: event.target.value,
            userInputAsArray: userInputAsArray,
        });



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
                        <p>Unit: {this.state.unitAssociated[this.state.unitInUsePTR]}</p>
                        <p>{this.state.errorMessage}</p>
                    </label>
                </div>
            </div>
        );
    }
}

export default NumInputForm6;
