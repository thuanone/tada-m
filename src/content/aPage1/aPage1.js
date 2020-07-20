import React from 'react';
import './aPage1.scss'
import {Tile} from 'carbon-components-react'


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
        this.setState({unit: unitName[1]});
        /*
        if (unitName[1]==='GiB'){
            this.setState({unit: 'recognized unit: GiB'})
        } 
        else if (unitName[1]==='MiB'){
            this.setState({unit: 'recognized unit: MiB'})
        }else {
            this.setState({unit: 'unknown unit'})
        };
        */
    };

    handleCheckUnit = (event) => {
        let value = event.target.value
        if (value==='GiB'){
            this.setState({unit: 'recognized unit: GiB', name: '0 GiB'})
        }
        else if (value==='MiB'){

            this.setState({unit: 'recognized unit: MiB', name: '0 MiB'})
        }
        else if (value==='vCPU'){

            this.setState({unit: 'recognized unit: vCPU', name: '0 vCPU'})
        }
        else if (value==='sec'){

            this.setState({unit: 'recognized unit: seconds', name: '0 s'})
        }
        else {

            this.setState({unit: 'unknown unit'})
        };
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
                    <input type="radio" name = "Units" onClick={this.handleCheckUnit} value = 'sec' />
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