import React from "react";
import { 
    Button, 
    Tile,
    Form,
    FormGroup,
    TextInput,

} from "carbon-components-react";

class NumInputForm3 extends React.Component {
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
            unitAssociated: initialState.unitAssociated
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
        this.checkValue = this.checkValue.bind(this);
        this.handleState = this.getValue.bind(this);
        this.stringMatchesSomeUnit = this.stringMatchesSomeUnit.bind(this);

    }
    stringMatchesSomeUnit(String) {
        let result


        for (const unit of this.state.unitAssociated) {
            let computedValue = String.localeCompare(unit);
            //case insensitive comparison of two strings, if equivalent returns 0

            if (computedValue == 0) {
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
        console.log(userInputNumbersAsNumbers);

        return userInputNumbersAsNumbers;
    }

    checkValue(userInputNumbersAsNumbers) {

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
                        wrongFormat = wrongFormat;
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
        }//returns 

        return true; //returns true if there is no error
    }

    handleChange(event) {
        console.log(this.state);
        console.log(this.initialState);
        let userInput = this.getValue(event);
        console.log(userInput);
        let isValid = this.checkValue(userInput);
        this.setState({ value: event.target.value });

        if (isValid) {
            this.setState({ errorMessage: '' });
        }

    }//should be used in final iteration

    render() {
        return (
            <Tile>
                <form onSubmit={this.handleSubmit}>
                    <input
                        type="text"
                        //value={displayValueWithNumber(this.state)}
                        value={this.state.value}
                        onChange={this.handleChange}
                    />
                    <p>Unit: {this.state.unit}</p>
                    <p>{this.state.errorMessage}</p>
                    <Button type="submit">Submit</Button>
                </form>
            </Tile>
            
        );
    }
}

export default NumInputForm3;