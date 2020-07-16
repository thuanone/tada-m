import React from 'react'
import ReactDOM from 'react-dom'
import { Route, Link, BrowserRouter as Router } from 'react-router-dom'
import './index.css'
import App from './App'
import Page from './content/aPage/Page'

const routing = (
  <Router>
    <div>
      <Route exact path="/" component={App} />
      <Route path="/aPage" component={Page} />
    </div>
  </Router>
)

ReactDOM.render(<App />, document.getElementById('root'))