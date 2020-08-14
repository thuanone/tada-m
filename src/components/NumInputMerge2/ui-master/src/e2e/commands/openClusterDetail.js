module.exports.command = function command() {
  return this.url(`${this.launch_url}${this.globals.proxyRoot}/clusters`)
    .waitForElementVisible('.armada-table-wrapper, .armada-empty-page', 60000)
    .ifElementExists('#location-filter .filter-reset', () => this
      .click('#location-filter .filter-reset')
      .pause(1000))
    .waitForElementVisible('.armada-table-wrapper[data-state="ready"]', 60000)
    .ifElementExists('#search-input', () => this.setValue('#search-input', this.globals.clusterName))
    .ifElementExists('.bx--search-input', () => this.setValue('.bx--search-input', this.globals.clusterName))
    .pause(1000)
    .waitForElementVisible(`.armada-table-wrapper td[title="${this.globals.clusterName}"]`, 10000)
    .pause(1000)
    .click(`.armada-table-wrapper td[title="${this.globals.clusterName}"]`)
    .waitForElementVisible('.armada-nodes-overview .armada-nodes-states', 60000);
};
