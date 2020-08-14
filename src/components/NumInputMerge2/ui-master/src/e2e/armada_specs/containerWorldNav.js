const overview = client => `.left-nav-list__item-link[href="${client.globals.proxyRoot}/overview"]`;
const clusters = client => `.left-nav-list__item-link[href="${client.globals.proxyRoot}/clusters"]`;
const registry = client => `.left-nav-list__item-link[href="${client.globals.proxyRoot}/registry/main/start"]`;
const helm = client => `.left-nav-list__item-link[href="${client.globals.proxyRoot}/helm"]`;

module.exports = {
  containerWorldNav: client => {
    client
      .url(`${client.launch_url}${client.globals.proxyRoot}/clusters`)
      .waitForElementVisible('.armada-table-wrapper[data-state="ready"]', 60000)
      .assert.elementCount('.left-nav-list__item-link', 4)
      .assert.containsText(overview(client), 'Overview')
      .assert.containsText(clusters(client), 'Clusters')
      .assert.containsText(registry(client), 'Registry')
      .assert.containsText(helm(client), 'Helm');
  },
};
