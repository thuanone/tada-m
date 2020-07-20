import React from 'react';
import './aPage1.scss'
import {Tile} from 'carbon-components-react'

class Page1 extends React.Component {

    state = {
        name:'',
        unit:''
    }

    handleChange = (event) => {
        this.setState({name: event.target.value});
    }

    handleRequest = (event) => {
        var unitName = this.state.name.split(' ');
        this.setState({unit: unitName[1]});
        if (unitName[1]==='GiB'){
            this.setState({unit: 'recognized unit: GiB'})
        } 
        else if (unitName[1]==='MiB'){
            this.setState({unit: 'recognized unit: MiB'})
        }else {
            this.setState({unit: 'unknown unit'})
        };
    }

    render(){
        return(
            <div className="div1">
                <Tile>Input field</Tile> <br/>
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