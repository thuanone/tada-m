import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { Route, Link, BrowserRouter as Router } from 'react-router-dom';

import Home from './home';
import aPage1 from './content/aPage1';
import aPage2 from './content/aPage2';
import aPage3 from './content/aPage3';



const routing = (
  <Router>
    <div>
      <ul>

        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/aPage1">aPage1</Link>
        </li>
        <li>
          <Link to="/aPage2">aPage2</Link>
        </li>
        <li>
          <Link to="/aPage3">aPage3</Link>
        </li>

      </ul>

      <Route exact path="/" component={Home} />
      <Route path="/aPage1" component={aPage1} />
      <Route path="/aPage2" component={aPage2} />
      <Route path="/aPage3" component={aPage3} />

    </div>
  </Router>
)
ReactDOM.render(routing, document.getElementById('root'))