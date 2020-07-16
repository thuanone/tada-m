import React, {Component} from "react";
import NumInput from './NumInput';

class App extends Component {
    state = {
        visible: true
    };
    render(){
        return(
            <div ClassName="App">
                <NumInput/>
            </div>
        );
    }
}

export default App;