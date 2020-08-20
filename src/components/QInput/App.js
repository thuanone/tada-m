import React from "react";

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value : 0
        };
    }
    handleClick() {
        this.setState({value:1});
    }
    render () {
        return (
            <div>
                <button onClick={this.handleClick}>Click Me</button>
            </div>
        );
    }
}

export {App};