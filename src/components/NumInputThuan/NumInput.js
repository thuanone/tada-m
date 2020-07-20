import React from "react";

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

function handleIncrement() {
    
}

function validateValue() {
    
}


class NumInputForm extends React.Component {
    constructor(props){
        super(props);
        this.state= {
            value: this.props.value,
            unit: this.props.unitAssociated,
            minVal: this.props.minVal,
            maxVals: this.props.maxVal,
            stepSize: this.props.stepSize,
            uppedUnits: this.props.uppedUnits,
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

    }
    getValue(event) {
        this.setState({value: event.target.value});
    }
    /*
    handleChange() {
        this.setState({value: event.target.value});
    }
    */

    render() {
        return(
            <form>
                <input
                    type="number" 
                    value={this.state.value}
                    onChange={this.getValue}
                />
            </form>
        );
    }
}

class handleChange {
    state(){

    }
}
export default NumInputForm;