const utils = require('../utils');

module.exports = {
  'Container related Catalog Items': client => {
    client
      .url(`${client.launch_url}/catalog`)
      .execute(utils.injectStyle)
      .waitForElementVisible('.nav-container', 30000)
      .click('.filter-item[data-id="containers"]')
      .pause(500)
      // .assert.containsText('.category-section.containers .category-header', 'Get started by creating a Kubernetes cluster, or manage your Docker images in the registry.')
      .assert.elementCount('.category-section.containers a.tile', 2);

      // TODO: re-enable once the catalog tiles point to the new /kubernetes root
      // .click(`a.tile[href$="${client.globals.proxyRoot}/catalog/cluster"]`)
      // .execute(utils.injectStyle)
      // .waitForElementVisible('.col-container', 30000)
      // .pause(500)
      // .back()
      // .execute(utils.injectStyle)
      // .waitForElementVisible('.catalog-container', 30000)
      // .click(`a.tile[href$="${client.globals.proxyRoot}/catalog/registry"]`)
      // .waitForElementVisible('.armada-page', 30000)
      // .pause(500)
      // .back()
      // .execute(utils.injectStyle)
      // .waitForElementVisible('.catalog-container', 30000)
      // .waitForElementVisible(`a.tile[href$="${client.globals.proxyRoot}/catalog/cluster"]`, 5000);
      // .assert.containsText(`a.tile[href^="${client.globals.proxyRoot}/catalog/cluster"] .text__headline--catalog`, 'IBM Cloud Kubernetes Service')
      // .assert.containsText(`a.tile[href^="${client.globals.proxyRoot}/registry/main/start"] .text__headline--catalog`, 'Container Registry');
      // .assert.containsText(`a.tile[href^="${client.globals.proxyRoot}/catalog/cluster"] .text__desc--catalog`, 'Create a cluster of compute hosts')
      // .assert.containsText(`a.tile[href^="${client.globals.proxyRoot}/registry/main/start"] .text__desc--catalog`, 'Manage Docker container images');
  },
};
