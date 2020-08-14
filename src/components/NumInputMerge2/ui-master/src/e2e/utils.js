const fs = require('fs');

function injectStyle() {
  const css = `
    #add-space-dialog,
    .intercom-block,
    .notifyjs-corner,
    .tc-feedback-button,
    .tourDialog {
      display: none !important;
    }`;
  const head = document.head || document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  style.type = 'text/css';
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
  head.appendChild(style);
}

function getTests(directory, startupTest, tests) {
  fs.readdirSync(`${__dirname}${directory}`).sort((a, b) => {
    // make sure clusterConfig is always the first test run
    if (a === `${startupTest}`) return -1;
    if (b === `${startupTest}`) return 1;
    return a.localeCompare(b);
  }).forEach(file => {
    if (!fs.statSync(`${__dirname}${directory}${file}`).isDirectory()) {
      const name = file.slice(0, -3);
      console.log(`Adding test file: ${__dirname}${directory}${name}`);
      // eslint-disable-next-line global-require
      tests.push(require(`${__dirname}${directory}${name}`));
    }
  });
}

function getColigoEnvironments() {
  const defaultEnvs = {
    "au-syd": "api.dev-serving.knative.dev.cloud.ibm.com",
    "eu-de": "api.test.knative.dev.cloud.ibm.com",
    "us-south": "api.us-south.knative.test.cloud.ibm.com"
  };

  try {
    environments = process.env.coligoEnvironments ? JSON.parse(process.env.coligoEnvironments) : defaultEnvs;
  } catch (err) {
    console.log('process.env.coligoEnvironments NOT SET. Using default values.');
    environments = defaultEnvs;
  }

  return environments;
}

function mapRegionToLocationDisplayName(regionId) {
  const regionMap = {
    'us-south': 'Dallas',
    'eu-de': 'Frankfurt',
    'au-syd': 'Sydney'
  };

  return regionMap[(regionId || 'us-south').toLowerCase()] || 'Dallas';  // always default to us-south (Dallas)
}

function getE2ETestRegion(preferredRegionId) {
  const environments = getColigoEnvironments();
  if (!preferredRegionId || !environments[preferredRegionId.toLowerCase()]) {
    return Object.keys(environments)[0];  // can get null/undefined!
  } else {
    return preferredRegionId.toLowerCase();
  }
}

function getE2ETestLocation(preferredRegionId) {
  return mapRegionToLocationDisplayName(getE2ETestRegion(preferredRegionId));
}

module.exports = { injectStyle, getColigoEnvironments, getE2ETestLocation, getE2ETestRegion, getTests, mapRegionToLocationDisplayName };
