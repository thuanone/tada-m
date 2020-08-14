const assert = require('assert');

/**
 * DEFINE GLOBAL E2E TEST variables here
 */
const CODEENGINE_UI_API_HEALTHCHECK_ENDPOINT = 'https://cloud.ibm.com/codeengine/api/monitoring/v1/status';


function getHealthStatus(healthEndpointUrl) {
  const fn = `getHealthStatus `;
  console.log(`${fn}> healthEndpointUrl: '${healthEndpointUrl}'`);

  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    $http.get(healthEndpointUrl, {
      headers: {
        'Authorization': `Foo-Bar`,
        'Content-Type': 'application/json',
      },
      strictSSL: false,
    },
      // Callback
      function (err, response, body) {
        console.log(`${fn}- Received a RC${response.statusCode} response after ${Date.now() - startTime}ms`);
        if(response.statusCode != 200) {
          console.log(`${fn}- Response:`, body);
          console.log(`${fn}- Response-full:`, response);
        }
        assert.equal(response.statusCode, 200, `${fn}- Expected a 200 OK response`);

        // convert the reponse to JSON
        const healthStatus = JSON.parse(body);

        console.log(`${fn}<`);
        resolve(healthStatus);
      }
    );
  });
}

async function doTest() {
  const fn = `>>>>>> doTest() `;
  console.log(`${fn}>`);

  const startTime = Date.now();

  //
  // We request the current application status using the codeengine health status endpoint
  console.log(`${fn}- Retrieve Code Engine Access Details ...`);
  const healthStatus = await getHealthStatus(CODEENGINE_UI_API_HEALTHCHECK_ENDPOINT);
  console.log(`healthStatus: '${JSON.stringify(healthStatus)}'`);
  const domain = healthStatus.payload.app.domain;
  const timestamp = healthStatus.payload.time;
  const reqId = healthStatus.reqId;
  assert.equal(healthStatus.payload.services['ace-cache'], 'OK', `ACE Cache does not work as expected in ${domain} - ts: ${timestamp}, req-id: '${reqId}'`);
  assert.equal(healthStatus.payload.services['ace-header'], 'OK', `ACE Header could not be loaded as expected in ${domain} - ts: ${timestamp}, req-id: '${reqId}'`);
  assert.equal(healthStatus.payload.services.iam, 'OK', `IAM Token API does not work as expected in ${domain} - ts: ${timestamp}, req-id: '${reqId}'`);
  assert.equal(healthStatus.payload.services['resource-controller'], 'OK', `IBM Cloud Resource Controller API does not work as expected in ${domain} - ts: ${timestamp}, req-id: '${reqId}'`);
  assert.equal(healthStatus.payload.services['configuration'], 'OK', `The configuration of the codeengine-ui microservice is not as expected in ${domain} - ts: ${timestamp}, req-id: '${reqId}'`);
  assert.equal(healthStatus.payload.services['launchdarkly'], 'OK', `The SaaS offering https://app.launchdarkly.com/ does not work as expected in ${domain} - ts: ${timestamp}, req-id: '${reqId}'`);

  //
  // DONE
  console.log(`${fn}< SUCCEEDED - duration: ${Date.now() - startTime}ms`);
}

doTest();