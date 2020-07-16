import React from "react";

export default class NumInput extends React.Component {
    state = {
        inputValues: 0,

    }

    render() {
        return (
            <form>
                <input type={this.state.inputValues}>
                </input>
            </form>
        )
    }
}