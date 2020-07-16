import React from 'react';

class Page1 extends React.Component {

    state = {
        name:'type something here...'
    }

    handleChange = (event) => {
        this.setState({name: event.target.value})
    }

    render(){
        return(
            <div>
                <input value= {this.state.name} onChange = {this.handleChange}/>
            <h1>{this.state.name}</h1>
            </div>
        );
    }
}


export default Page1;