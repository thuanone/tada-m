import React from "react";

class NumInput extends React.Components {
    state = {
        value: "",

    }

    render() {
        return(
            <Form>
                <input 
                    type="number" 
                    value={this.state.value}
                />
            </Form>
        );
    }
}
export default NumInput;