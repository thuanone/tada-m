import React from "react";
import { Button } from "carbon-components-react";

/*
function CPU_Unit() {
    return {    
        unitAssociated:['m','CPU'],
        value: 0,
        minVal: 0,
        maxVal: 10,
        stepSize:[0.25,0.5,1,],
        nextUnitIncrement:[0.25,0.50,0.75,1.0,1.25,1.5],
        uppedUnits: false,
    }
*/
const CPU_Unit = {   
    unitAssociated:['m','CPU'],
    value: 0,
    minVal: 0,
    maxVal: 10,
    stepSize:[0.25,0.5,1,],
    nextUnitIncrement:[0.25,0.50,0.75,1.0,1.25,1.5],
    uppedUnits: false,
}

function Memory_Unit() {
    return {
        unitAssociated:['MiB','GiB'],
        value: 0,
        minVal: 0,
        maxVal: 10,
        stepSize:[1,],
        nextUnitIncrement:[128,256,512,1024],
        uppedUnits: false,
    }

}

function displayValueWithNumber(state) {
    return `${state.value} ${state.unit}`
}

function handleIncrement() {
    
}

class NumInputForm extends React.Component {
    constructor(props){
        super(props);
        /*
        const initialState = {
            value: (props.value ? props.value : 0),
            unit: (props.unitAssociated ? props.unitAssociated : ['',]),
            minVal: (props.minVal ? props.minVal : 0),
            maxVals: (props.maxVal ? props.minVal : 100),
            stepSize: (props.stepSize ? props.stepSize : [1,]),
            uppedUnits: (props.uppedUnits ? props.uppedUnits : [1]),
            //errorMessageString, set in valdidate()
            errorMessage: "",
        }
        */
        this.state= {
            value: (props.value ? props.value : 0),
            unit: (props.unitAssociated ? props.unitAssociated : ['',]),
            minVal: (props.minVal ? props.minVal : 0),
            maxVals: (props.maxVal ? props.minVal : 100),
            stepSize: (props.stepSize ? props.stepSize : [1,]),
            uppedUnits: (props.uppedUnits ? props.uppedUnits : [1]),
            //errorMessageString, set in valdidate()
            errorMessage: "",
        };
        /* Setzt alle Werte auf undefined -> wahrscheinlich, weil props.xx.y nicht existieren
        this.state={
            value: props.value,
            unit: props.unitAssociated,
            minVal: props.minVal,
            maxVals: props.maxVal,
            stepSize: props.stepSize,
            uppedUnits: props.uppedUnits,
        };
        */

        this.getValue = this.getValue.bind(this);
        this.handleState = this.getValue.bind(this);

    }
    getValue(event) {
        console.log(event.target.value);
        
        var userInput = this.state

        this.setState({value: event.target.value});

    }
    /*
    handleState() {
        this.setState({value: event.target.value});
    }
    */

    validate (unit, minVal, maxVal) {
        let unitError=``;
        let minValError=``;
        let maxValError= ``;
        let incorrectInput=``;

        if (this.state.value.includes(`${unit}`)) {
            unitError=`input is not ${unit}`;
            return false
        }
        /*minValError Validation
        if(this.state.value < this.state.minVal) {
            minValError=`minimum value is ${minVal}`;
        }
        */
       /*maxValError Validation
        if(this.state.value > this.state.maxVal) {
           maxValError= `maximum value is ${maxVal}`,
        }
        */
       /*incorrectInputFormError Validation
        if(this.state.value < this.state.minVal) {
            incorrectInputFormatError=`input is not in the correct format`;
        }
        */
       

        return true;
    }
    /*
    handleChange() {
        this.setState({value: event.target.value});
    }
    */

    
    handleSubmit = (event) => {
        event.preventDefault();
        const isValid = this.validate(this.state.unit, this.state.minVal, this.state.maxVal);
        if(isValid) {
            console.log(this.state);
            //clear error message
            this.setState({errormessage: ``})
        }
        console.log(this.state);
    }
    

    render() {
        return(
            <form /*onSubmit={}*/>
                <input
                    type="number" 
                    //value={displayValueWithNumber(this.state)}
                    value={this.state.value}
                    onChange={this.getValue}
                />
                <p>Unit:{this.state.unit[0]}</p>
                <p>{this.state.errorMessage}</p>
                <Button type="submit">Submit</Button>
            </form>
        );
    }
}

class handleChange {
    state(){

    }
}
export default NumInputForm;