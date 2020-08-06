import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import { Route, Link, BrowserRouter as Router } from 'react-router-dom';
import { Button } from "carbon-components-react";

import { Document24 as Document} from "@carbon/icons-react";
import {
  Content,
  SideNav,
  SideNavItems,
  SideNavLink,
  SideNavMenu,
  SideNavMenuItem
} from "carbon-components-react/lib/components/UIShell";


import Home from './home';
import Page1 from './content/Page1';
import Page2 from './content/Page2';
import Page3 from './content/Page3';
import Page4 from './content/Page4';
import Page5 from './content/Page5';
import Page6 from './content/Page6';
import Page7 from './content/Page7';
import Page8 from './content/Page8';

import Page10 from './content/Page10';

import Page12 from './content/Page12';

import PageM from './content/PageM';
import PageM2 from './content/PageM2';

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
              <Link to="/Page1"> 
                <Button><Document /> Page1</Button>
              </Link>
          </div>

          <div class="bx--col">
              <Link to="/Page2"> 
                <Button><Document /> Page2</Button>
              </Link>
          </div>
  
          <div class="bx--col">
              <Link to="/Page3"> 
                <Button><Document /> Page3</Button>
              </Link>
          </div>

          <div class="bx--col">
              <Link to="/Page4"> 
                <Button><Document /> Page4</Button>
              </Link>
          </div>

          <div class="bx--col">
              <Link to="/Page5"> 
                <Button><Document /> Page5</Button>
              </Link>
          </div>

          <div class="bx--col">
              <Link to="/Page6"> 
                <Button><Document /> Page6</Button>
              </Link>
          </div>

          <div class="bx--col">
              <Link to="/Page7"> 
                <Button><Document /> Page7</Button>
              </Link>
          </div>

          <div class="bx--col">
              <Link to="/Page8"> 
                <Button><Document /> Page8</Button>
              </Link>
          </div>

          <div class="bx--col">
              <Link to="/Page10"> 
                <Button><Document /> Page10</Button>
              </Link>
          </div>

          <div class="bx--col">
              <Link to="/Page12"> 
                <Button><Document /> Page12</Button>
              </Link>
          </div>

          <div class="bx--col">
              <Link to="/PageM"> 
                <Button><Document /> PageM</Button>
              </Link>
          </div>
          
          <div class="bx--col">
              <Link to="/PageM2"> 
                <Button><Document /> PageM2</Button>
              </Link>
          </div>
          

        </div>
      </div>
    </ul>

    <Route exact path="/home" content={Home} />
    <Route path="/Page1" component={Page1} />
    <Route path="/Page2" component={Page2} />
    <Route path="/Page3" component={Page3} />
    <Route path="/Page4" component={Page4} />
    <Route path="/Page5" component={Page5} />
    <Route path="/Page6" component={Page6} />
    <Route path="/Page7" component={Page7} />
    <Route path="/Page8" component={Page8} />

    <Route path="/Page10" component={Page10} />
    <Route path="/Page12" component={Page12} />
    <Route path="/PageM" component={PageM} />
    <Route path="/PageM2" component={PageM2} />

  </div>
</Router>
)
ReactDOM.render(routing, document.getElementById('root'))