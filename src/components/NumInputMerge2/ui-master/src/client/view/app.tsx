import React from 'react';
import app from '../utils/app';
import App from './components/App';

const init = () => {
  app.init(
    <App />
  );
};

window.armada.init = init;
export default init;
