import React from 'react';
import './home.scss';


class Home extends React.Component {
  state = {
    check1: true
  };

  handleCheck = (event) => {
    this.setState({check1: event.target.checked});
  };
  handleSubmit = (event) => {
    console.log(this.state)
  }

  render() {
    return (
      <div>
        <h1>Home</h1>
        <div className="tasks">
          <h2>Tasks</h2>
          <input type="checkbox" onClick={this.handleCheck} checked={this.state.check1}/> <a>creating a react app</a>
        </div>
        <button className="button1" onClick= {this.handleSubmit}>Submit</button>
      </div>
    )
  }
}


export default Home;
