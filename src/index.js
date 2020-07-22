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
import aPage4 from './content/aPage4';
import aPage5 from './content/aPage5';
import aPage6 from './content/aPage6';


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

          <div class="bx--col">
              <Link to="/aPage4"> 
                <Button><Document /> aPage4</Button>
              </Link>
          </div>

          <div class="bx--col">
              <Link to="/aPage5"> 
                <Button><Document /> aPage5</Button>
              </Link>
          </div>

          <div class="bx--col">
              <Link to="/aPage6"> 
                <Button><Document /> aPage6</Button>
              </Link>
          </div>
          

        </div>
      </div>
    </ul>

    <Route exact path="/home" component={Home} />
    <Route path="/aPage1" component={aPage1} />
    <Route path="/aPage2" component={aPage2} />
    <Route path="/aPage3" component={aPage3} />
    <Route path="/aPage4" component={aPage4} />
    <Route path="/aPage5" component={aPage5} />
    <Route path="/aPage6" component={aPage6} />

  </div>
</Router>
)
ReactDOM.render(routing, document.getElementById('root'))