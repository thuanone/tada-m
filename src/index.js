import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import { Route, Link, BrowserRouter as Router } from 'react-router-dom';
import { Button } from "carbon-components-react";

import { Document24 as Document} from "@carbon/icons-react";

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
            <Link to="/home">
              <Button><Document/> Home </Button> 
            </Link>
          </div>
          
          <div class="bx--col">
              <Link to="/aPage1"> 
                <Button><Document /> aPage1</Button>
              </Link>
          </div>

          <div class="bx--col">
              <Link to="/aPage2"> 
                <Button><Document /> aPage2</Button>
              </Link>
          </div>
  
          <div class="bx--col">
              <Link to="/aPage3"> 
                <Button><Document /> aPage3</Button>
              </Link>
          </div>

        </div>
      </div>
    </ul>

    <Route exact path="/home" component={Home} />
    <Route path="/aPage1" component={aPage1} />
    <Route path="/aPage2" component={aPage2} />
    <Route path="/aPage3" component={aPage3} />

  </div>
</Router>
)
ReactDOM.render(routing, document.getElementById('root'))