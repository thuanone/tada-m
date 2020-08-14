import React from 'react';

function duplicator(max, component) {
  const results = [];
  for (let i = 0; i < max; i++) {
    results.push(<React.Fragment key={i}>{component}</React.Fragment>);
  }
  return results;
}

export default duplicator;
