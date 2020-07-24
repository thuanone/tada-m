import React from "react";

class UnitFieldset extends React.Component {

    handleCheckUnit = (event) => {
        let value = event.target.value
        if (unitList.includes(value)){
            this.setState({name:'0 '+ value, radioNone: false})
        }else{
            this.setState({unit: 'please specify unit', radioNone: true, name:''})
        }
    } 
    render(){
        return(
            <div className="UnitFieldset">
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
            </div>
        )
    }
}

export default UnitFieldset;