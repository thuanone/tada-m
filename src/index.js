import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import { Route, Link, BrowserRouter as Router } from 'react-router-dom';
import { Button } from "carbon-components-react";

import { Document24 as Document} from "@carbon/icons-react";

import Home from './home';
import QInputPage from './content/QInputPage/QInputPage';
import InputPage from './content/InputPage/InputPage';

const routing = (
<Router>
  <div>
    <ul>
      <div className="bx--grid">
        <div className="bx--row">

          <div className="bx--col">
            <Link to="/home">
              <Button><Document/> Home </Button> 
            </Link>
          </div>
          
          <div className="bx--col">
              <Link to="/QInput"> 
                <Button><Document /> QInput</Button>
              </Link>
          </div>

          <div className="bx--col">
              <Link to="/InputPage"> 
                <Button><Document /> InputPage</Button>
              </Link>
          </div>
          

        </div>
      </div>
    </ul>

    <Route exact path="/home" component={Home} />
    <Route path="/QInput" component={QInputPage} />
    <Route path="/InputPage" component={InputPage} />

  </div>
</Router>
);
ReactDOM.render(routing, document.getElementById('root'));