import React from 'react';
import './home.scss';


class Home extends React.Component {
  render() {
    return (
      <div>
        <h1>Home</h1>
        <div className="tasks">
          <h2>Tasks</h2>
          <input type="checkbox" checked="true"/> <a>creating a react app</a>
        </div>
      </div>
    )
  }
}


export default Home;
