import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import { Route, Link, BrowserRouter as Router } from 'react-router-dom';

import { Document32 } from "@carbon/icons-react";

import Home from './home';
import aPage1 from './content/aPage1';
import aPage2 from './content/aPage2';
import aPage3 from './content/aPage3';


const routing = (
  <Router>
    <div>
      <ul>

        <div class="bx--grid">
          <div class="bx--row">

            <div class="bx--col">
                <Link to="/"> <Document32 /> Home</Link>
            </div>
            <div class="bx--col">
              <Link to="/aPage1"> <Document32 /> aPage1</Link>
            </div>
            <div class="bx--col">
              <Link to="/aPage2"> <Document32 /> aPage2</Link>
            </div>
            <div class="bx--col">
              <Link to="/aPage3"> <Document32 /> aPage3</Link>
            </div>

          </div>
        </div>
      </ul>

      <Route exact path="/" component={Home} />
      <Route path="/aPage1" component={aPage1} />
      <Route path="/aPage2" component={aPage2} />
      <Route path="/aPage3" component={aPage3} />

    </div>
  </Router>
)
ReactDOM.render(routing, document.getElementById('root'))