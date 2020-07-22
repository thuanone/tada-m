import React from 'react';
import './aPage3.scss'
import {Tile, RadioButton} from 'carbon-components-react'

const unitList = ['GiB','MiB','vCPU','s'];

const minNum = -1
const maxNum = 100

class aPage3 extends React.Component {

    state = {
        name:'',
        unit:'please specify unit',
        GiB: false,
        MiB: false,
        vCPU: false,
        sec: false,
        radioNone: true,
    };

    
    handleChange = (event) => {
        this.setState({name: event.target.value});
    }

    handleRequest = (event) => {
        var inputField = this.state.name.split(' ');
        
        if (unitList.includes(inputField[1])){
            this.setState({unit: 'recognized unit: ' + inputField[1] })
        } 
        
        else {
            this.setState({unit: 'unknown unit', radioNone:true})
        };

    };

    increaseNum = (event) =>{
        var inputField = this.state.name.split(' ');

        if (inputField[0] ===''){
            this.setState({unit: 'please specify unit'})
        }

        if ( (parseFloat(inputField[0]) + 10) <= maxNum ){
            this.setState({name: String( parseFloat(inputField[0]) +10) + ' ' + inputField[1] })
        }
    }
    decreaseNum = (event) =>{
        var inputField = this.state.name.split(' ');

        if (inputField[0] ===''){
            this.setState({unit: 'please specify unit'})
        }

        if ( (parseFloat(inputField[0]) -10) >= minNum ){
            this.setState(  {name: String( parseFloat(inputField[0]) -10) + ' ' + inputField[1] })
        }
    }


    handleCheckUnit = (event) => {
        let value = event.target.value
        if (unitList.includes(value)){
            this.setState({name:'0 '+ value, radioNone: false})
        }else{
            this.setState({unit: 'please specify unit', radioNone: true, name:''})
        }
    }

    resetVal = (event) =>{
        this.setState({name:'', radioNone: true, unit: 'please specify unit'})
    } 


    render(){
        return(
            <div className="div1">
                <Tile>Input field</Tile> <br/>

                <fieldset>
                    <input className='radiobtn' type="radio" name = "Units" onClick={this.handleCheckUnit} value ='GiB' checked ={this.state.GiB}/>
                    <a>GiB</a>
                    <input className='radiobtn' type="radio" name = "Units" onClick={this.handleCheckUnit} value = 'MiB' checked ={this.state.MiB}/>
                    <a>MiB</a>
                    <input className='radiobtn' type="radio" name = "Units" onClick={this.handleCheckUnit} value = 'vCPU' checked ={this.state.vCPU}/>
                    <a>vCPU</a>
                    <input className='radiobtn' type="radio" name = "Units" onClick={this.handleCheckUnit} value = 's' checked ={this.state.sec}/>
                    <a>Seconds</a>
                    <input className='radiobtn0' type="radio" name = "Units" onClick={this.handleCheckUnit} value = 'none' checked ={this.state.radioNone}/>
                    <a>none</a>
                </fieldset>

        
                <input className="input1"
                    placeholder="type something here..." 
                    value= {this.state.name} 
                    onChange = {this.handleChange}
                />

                <button onClick={this.decreaseNum}> - </button>
                <button onClick= {this.increaseNum}> + </button> <br/>

                <button className="send-btn" onClick = {this.handleRequest}>send request</button>
                <button className='reset-btn' onClick ={this.resetVal}> reset </button>

                <Tile>{this.state.unit}</Tile>
            </div>
        );
    }
}


export default aPage3;