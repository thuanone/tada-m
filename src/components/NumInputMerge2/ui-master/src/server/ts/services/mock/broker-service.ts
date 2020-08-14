/**
 * This is a mock service of the Broker API.
 * It will be replaced by the real Broker API in the near future.
 * For the real implementation there will be different endpoints per region,
 * which will have to be checked separately:
 *
 * Staging Endpoints
 * - au-syd: https://broker-proxy.dev-serving.codeengine.dev.cloud.ibm.com
 * - eu-de: https://broker-proxy.test.codeengine.dev.cloud.ibm.com
 * - us-south: https://broker-proxy.stage.codeengine.dev.cloud.ibm.com
 *
 * Prod Endpoints
 * - us-south: https://broker-proxy.us-south.codeengine.dev.cloud.ibm.com
 */
export const brokerApi = {
    // This currently always returns liftedLimitations=true and is only used as mock data
    getLiftedLimitations: (req, region?) => new Promise((resolve) => {
        resolve(true);
    })
};
