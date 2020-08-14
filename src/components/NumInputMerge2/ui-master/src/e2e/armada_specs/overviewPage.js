module.exports = {
  'Overview Page': client => {
    client
      .url(`${client.launch_url}${client.globals.proxyRoot}/overview`)
      .waitForElementVisible('.overview-pricing', 60000)
      .assert.title('IBM Cloud')
      .assert.containsText('.bx--type-alpha', 'Deploy, scale, and manage your containerized application workloads')
      .assert.attributeContains('.overview-daily-body > p:nth-child(3) > span:nth-child(1) > a:nth-child(2)', 'href', 'docs/containers?topic=containers-cs_cluster_tutorial#cs_cluster_tutorial_lesson1')
      .assert.attributeContains('.overview-daily-body > p:nth-child(6) > span:nth-child(1) > a:nth-child(2)', 'href', 'docs/services/Registry?topic=registry-registry_setup_cli_namespace#cli_namespace_registry_cli_install')
      .assert.attributeContains('.overview-float:nth-child(1) > div:nth-child(2) > a:nth-child(3)', 'href', 'docs/containers?topic=containers-getting-started')
      .assert.attributeContains('.overview-float:nth-child(2) > div:nth-child(2) > a:nth-child(3)', 'href', 'docs/containers?topic=containers-cs_cluster_tutorial#cs_cluster_tutorial_lesson1')
      .assert.attributeContains('.overview-section:nth-child(1) > div:nth-child(1) > a:nth-child(2)', 'href', 'catalog/cluster/create')
      .assert.attributeContains('.overview-pricing-right .bx--btn', 'href', '/catalog/cluster/create');
  },
};
