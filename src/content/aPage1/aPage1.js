import React from 'react';
import './aPage1.scss'
import {Tile} from 'carbon-components-react'

const unitList = ['GiB','MiB','vCPU','s'];

class Page1 extends React.Component {

    state = {
        name:'',
        unit:'',
        GiB: false,
        MiB: false,
        vCPU: false,
        sec: false,
    };

    
    handleChange = (event) => {
        this.setState({name: event.target.value});
    };

    handleRequest = (event) => {
        var inputField = this.state.name.split(' ');
        
        if (unitList.includes(inputField[1])){
            this.setState({unit: 'recognized unit: ' + inputField[1] })
        } 
        
        else {
            this.setState({unit: 'unknown unit'})
        };

    };

    increaseNum = (event) =>{
        var inputField = this.state.name.split(' ');
        this.setState({name: String( parseFloat(inputField[0]) +10) + ' ' + inputField[1] 
        })
    }
    decreaseNum = (event) =>{
        var inputField = this.state.name.split(' ');
        this.setState({name: String( parseFloat(inputField[0]) -10) + ' ' + inputField[1] 
        })
    }


    handleCheckUnit = (event) => {
        let value = event.target.value
        if (unitList.includes(value)){
            this.setState({name:'0 '+ value})
        }

    }


    render(){
        return(
            <div className="div1">
                <Tile>Input field</Tile> <br/>

                <fieldset>
                    <input type="radio" name = "Units" onClick={this.handleCheckUnit} value ='GiB'/>
                    <a>GiB</a>
                    <input type="radio" name = "Units" onClick={this.handleCheckUnit} value = 'MiB'/>
                    <a>MiB</a>
                    <input type="radio" name = "Units" onClick={this.handleCheckUnit} value = 'vCPU' />
                    <a>vCPU</a>
                    <input type="radio" name = "Units" onClick={this.handleCheckUnit} value = 's' />
                    <a>Seconds</a>
                </fieldset>

                <button onClick={this.decreaseNum}> - </button>
                <input className="input1"
                    placeholder="type something here..." 
                    value= {this.state.name} 
                    onChange = {this.handleChange}
                />
                <button onClick= {this.increaseNum}> + </button>

                <button className="button1" onClick= {this.handleRequest}>send request</button>

                <Tile>{this.state.unit}</Tile>
            </div>
        );
    }
}


export default Page1;