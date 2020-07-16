import React from "react";

class NumInput extends React.Components {
    state = {
        value: "",

    }

    render() {
        return(
            <form>
                <input 
                    type="number" 
                    value={this.state.value}
                />
            </form>
        );
    }
}
export default NumInput;