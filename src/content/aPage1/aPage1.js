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
        var unitName = this.state.name.split(' ');
        
        if (unitList.includes(unitName[1])){
            this.setState({unit: 'recognized unit: ' + unitName[1] })
        } 
        
        else {
            this.setState({unit: 'unknown unit'})
        };

    };

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
            

                <input className="input1"
                    placeholder="type something here..." 
                    value= {this.state.name} 
                    onChange = {this.handleChange}
                />
                <button className="button1" onClick= {this.handleRequest}>send request</button>
                <Tile>{this.state.unit}</Tile>
            </div>
        );
    }
}


export default Page1;