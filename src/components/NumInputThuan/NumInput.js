import React from "react";

class NumInputForm extends React.Component {
    constructor(props){
        super(props);
        this.state={value:''}

        this.handleChange = this.handleChange.bind(this);

    }
    handleChange(event) {
        this.setState({value: event.target.value});
    }

    render() {
        return(
            <form>
                <input 
                    type="number" 
                    value={this.state.value}
                    onChange={this.handleChange}
                />
            </form>
        );
    }
}
export default NumInputForm;