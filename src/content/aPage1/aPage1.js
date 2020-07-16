import React from 'react';
import './aPage1.scss'

class Page1 extends React.Component {

    state = {
        name:''
    }

    handleChange = (event) => {
        this.setState({name: event.target.value})
    }

    render(){
        return(
            <div className="div1">
                <a>Input field v1</a> <br/>
                <input 
                    placeholder="type something here..." 
                    value= {this.state.name} 
                    onChange = {this.handleChange}
                />
            <p>{this.state.name}</p>
            </div>
        );
    }
}


export default Page1;