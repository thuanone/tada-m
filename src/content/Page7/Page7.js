import React from 'react';
import './Page7.scss'


const unitList = ['GiB','MiB','vCPU','s'];

const minNum = -1
const maxNum = 100

class Page7 extends React.Component {

    
    state = {
        name:'',
        unit:'please specify unit',
        GiB: false,
        MiB: false,
        vCPU: false,
        sec: false,
        radioNone: true,
        inputField:'',
    };


    validateInput = (event) => {
        this.setState({name: event.target.value});
        this.handleRequest(event);
    }

    handleRequest = (event) => {
        let inputField = event.target.value.split(' ');

        if (isNaN( parseFloat(inputField[0]) ) ){ // Checks if a number comes first
            this.setState({unit: inputField[0] + ' is not a valid number'});
        }
        else {
            if (unitList.includes( inputField[1] )){ // checks if the unit comes next

                this.setState({unit: 'recognized unit: ' + inputField[1]});
                this.handleCheckUnit(event);
            }
            else if (inputField[1] == ' '){
            }

            else {
                this.setState({unit: inputField[1]+ ' is not a valid unit'})
            }
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
            <div>
                <p>Choose Unit</p> 

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

                <div class="bx--form-item bx--text-input-wrapper">
                    <label for="test2" class="bx--label">
                        NumberInput vA
                    </label>
                    <div class="bx--text-input__field-outer-wrapper">
                        <div class="bx--text-input__field-wrapper">
                            <div class="bx--number__input-wrapper">

                                <input type="text" class="bx--text-input bx--text__input" 
                                    id="test2" 
                                    placeholder="type something here..." 
                                    value= {this.state.name} 
                                    onChange = {this.validateInput}>
                                </input>

                                <div class="bx--number__controls">

                                    <button class="bx--number__control-btn up-icon" type="button" onClick={this.increaseNum} title="Increment number" aria-label="Increment number" aria-live="polite" aria-atomic="true">
                                        <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="8" height="4" viewBox="0 0 8 4" aria-hidden="true" class="up-icon">
                                            <path d="M0 4L4 0 8 4z"></path>
                                        </svg>
                                    </button>

                                    <button class="bx--number__control-btn down-icon" type="button" onClick= {this.decreaseNum} title="Decrement number" aria-label="Decrement number" aria-live="polite" aria-atomic="true">
                                        <svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="8" height="4" viewBox="0 0 8 4" aria-hidden="true" class="down-icon">
                                            <path d="M8 0L4 4 0 0z"></path>
                                        </svg>
                                    </button>

                                </div>
                             </div>
                         </div>

                    <div class="bx--form__helper-text">
                        {this.state.unit}
                    </div>

                    <button className="send-btn" onClick = {this.handleRequest}>send request</button>
                    <button className='reset-btn' onClick ={this.resetVal}> reset </button>

                </div>
            </div>
            
        </div>
        );
    }
}

export default Page7;