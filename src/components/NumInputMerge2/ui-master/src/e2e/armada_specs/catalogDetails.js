const utils = require('../utils');

module.exports = {
  'Kubernetes Service Catalog Details Page': client => {
    client
      .url(`${client.launch_url}/catalog`)
      .execute(utils.injectStyle)
      .waitForElementVisible('.nav-container', 60000)
      .click('div.filter-item[data-id="containers"]')
      .pause(1000)
      .assert.elementCount('.category-section.containers a.tile', 2);
      // TODO: re-enable once the catalog tiles point to the new /kubernetes root
      // .waitForElementVisible(`a.tile[href$="${client.globals.proxyRoot}/catalog/cluster"]`, 30000)
      // .click(`a.tile[href$="${client.globals.proxyRoot}/catalog/cluster"]`)
      // .log('Tile clicked...')
      // .waitForElementPresent('.armada-header-wrapper', 30000)
      // .execute(utils.injectStyle)
      // .waitForElementNotPresent('.bx--skeleton__text', 30000)
      // .assert.containsText('.armada-page-header-title', 'Kubernetes Service')
      // .assert.containsText('.bx--footer-cta .bx--btn--primary', 'Create')
      // .waitForElementVisible('.bx--footer-cta .bx--btn--primary', 30000)
      // .click('.bx--footer-cta .bx--btn--primary')
      // .waitForElementVisible('.col-container', 30000)
      // .assert.title('Create Cluster - IBM Cloud');

      // TODO: don't follow doc links directly, use .link() to test them
      // .url(`${client.launch_url}${client.globals.proxyRoot}/catalog/cluster`)
      // .waitForElementVisible('a.bx--link[href$="https://www.ibm.com/cloud-computing/bluemix/contact-us"]', 30000)
      // .click('a.bx--link[href$="https://www.ibm.com/cloud-computing/bluemix/contact-us"]')
      // .log('Contact IBM Cloud Sales clicked')
      // .url((result) => {
      //   // should go directly to the url
      //   client.assert.equal(result.value, 'https://www.ibm.com/cloud-computing/bluemix/contact-us');
      // })
      // .url(`${client.launch_url}${client.globals.proxyRoot}/catalog/cluster`)
      // .execute(utils.injectStyle)
      // .waitForElementVisible('a.bx--link[href$="/pricing/configure/iaas/containers-kubernetes"]', 30000)
      // .click('a.bx--link[href$="/pricing/configure/iaas/containers-kubernetes"]')
      // .log('Contact IBM Cloud Sales clicked')
      // .url((result) => {
      //   // pricing url redirects to /estimator/review
      //   client.assert.equal(result.value, `${client.launch_url}/estimator/review`);
      // });
  },
  'Container Registry Catalog Details Page': client => {
    client
      .url(`${client.launch_url}/catalog`)
      .execute(utils.injectStyle)
      .waitForElementVisible('.nav-container', 60000)
      .click('div.filter-item[data-id="containers"]')
      .pause(1000)
      .assert.elementCount('.category-section.containers a.tile', 2);

      // TODO: re-enable once the catalog tiles point to the new /kubernetes root
      // .waitForElementVisible(`a.tile[href$="${client.globals.proxyRoot}/catalog/registry"]`, 30000)
      // .click(`a.tile[href$="${client.globals.proxyRoot}/catalog/registry"]`)
      // .log('Tile clicked...')
      // .waitForElementPresent('.armada-header-wrapper', 30000)
      // .execute(utils.injectStyle)
      // .waitForElementNotPresent('.bx--skeleton__text', 30000)
      // .assert.containsText('.armada-page-header-title', 'Container Registry')
      // .assert.containsText('.bx--footer-cta .bx--btn--primary', 'Create')
      // .waitForElementVisible('.bx--footer-cta .bx--btn--primary', 30000)
      // .click('.bx--footer-cta .bx--btn--primary')
      // .waitForElementVisible('.registry-dashboard', 30000);

      // .assert.title('Create Cluster - IBM Cloud');
  },
};
