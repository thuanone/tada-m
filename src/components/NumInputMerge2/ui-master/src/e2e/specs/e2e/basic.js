const seconds = 1000;
const minutes = 60 * seconds;
const cookies = [];

// const overview = client => `.left-nav-list__item-link[href="${client.globals.proxyRoot}/overview"]`;
// const clusters = client => `.left-nav-list__item-link[href="${client.globals.proxyRoot}/clusters"]`;
// const workloads = client => `.left-nav-list__item-link[href="${client.globals.proxyRoot}/workloads"]`;
// const registry = client => `.left-nav-list__item-link[href="${client.globals.proxyRoot}/registry/main/start"]`;
// const security = '.left-nav-list__item--has-children:nth-of-type(4) > .left-nav-list__item-link';
// const policySettings = client => `.left-nav-list__item-link[href="${client.globals.proxyRoot}/security/policySettings"]`;
// const solutions = '.left-nav-list__item--has-children:nth-of-type(5) > .left-nav-list__item-link';
// const helmCharts = client => `.left-nav-list__item-link[href="${client.globals.proxyRoot}/solutions/helm-charts"]`;

 module.exports = {
  before: (client, done) => {
    // When running in the console deployment pipeline the console URL is provided as an env var
    if (process.env.CONSOLE_URL) client.launch_url = process.env.CONSOLE_URL;
    done();
  },

  beforeEach: (client, done) => {
    client.init(client.launch_url).maximizeWindow();
    if (cookies.length > 0 && client.currentTest.name !== 'Login') {
      client.setCookies(cookies)
        .url(`${client.launch_url}${client.globals.proxyRoot}`)
        .waitForElementVisible('.coligo-ui', 1 * minutes)
        .perform(() => done());
    } else client.url(`${client.launch_url}${client.globals.proxyRoot}`).perform(() => done());
  },

  Login: client => client
    .login()
    .saveCookies(cookies)
    .setAccountByName(process.env.E2E_TEST_ACCOUNT_NAME || client.globals.accountName),
    //.setAccount(process.env.E2E_TEST_ACCOUNT || client.globals.account),

/*   PageObjectTests: (client) => {
     client.page.overview()
       .navigate()
       .assert.urlEquals(`${client.launch_url}${client.globals.proxyRoot}/overview`);
     client.page.projectList()
       .navigate()
       .assert.urlEquals(`${client.launch_url}${client.globals.proxyRoot}/projects`);
     client.page.cli()
       .navigate()
       .assert.urlEquals(`${client.launch_url}${client.globals.proxyRoot}/cli`);
     client.page.createComponent()
       .navigate()
       .assert.urlEquals(`${client.launch_url}${client.globals.proxyRoot}/create/component`);
     client.page.createProject()
       .navigate()
       .assert.urlEquals(`${client.launch_url}${client.globals.proxyRoot}/create/project`);
   },
*/

/*   OverviewPage: (client) => {
      client.page.overview()
        .navigate()
        .waitForElementVisible('@viewTutorialsLink')
        .waitForElementVisible('@createProjectBtn')
        .section.worldNav.click('@projects');
      client.page.projectList()
        //.assert.elementPresent('@learnAboutProjectsLink')
        .assert.elementPresent('@createProjectBtn')
        .click('@createProjectBtn');
      client.page.createProject()
        .assertCreateButtonEnabled(false)
        .setProjectName('e2e_project1')
        .selectResourceGroup('default')
        .selectLocation('Frankfurt')
        .assert.containsText('@resourceGroupLabel', 'default (default)')
        .assert.containsText('@regionLabel', 'Frankfurt')
        .assertCreateButtonEnabled(true)
        .clickCancelButton();
   },

   ProjectCreateAndDelete: (client) => {
     const projName = `e2e_provisioning_proj_${Date.now().toString(16)}`;

     client.page.projectList()
       .navigate()
       .assert.elementPresent('@createProjectBtn')
       .click('@createProjectBtn');
     client.page.createProject()
       .assertCreateButtonEnabled(false)
       .setProjectName(projName)
       .selectResourceGroup('default')
       .selectLocation('Sydney')
       .assert.containsText('@resourceGroupLabel', 'default (default)')
       .assert.containsText('@regionLabel', 'Sydney')
       .assertCreateButtonEnabled(true)
       .clickCreateButton()
       .waitForLoadingDone();
     client.page.projectList()
       .gotoProject(projName);  // doesn't work for provisioning projects!
   },

   ComponentsListPage: (client) => {
     const projName = 'e2e_default_project';

     client.page.projectList()
       .navigate()
       .waitUntilLoaded()
       .gotoProject(projName)
     client.page.componentList()
       .waitUntilLoaded()
       .deleteProject()
     client.page.deleteProjectModal()
       .waitUntilLoaded()
       .cancel();
   },

  TablePageObjectTest: (client) => {
    const projName = 'e2e_default_project';

    client.page.projectList()
      .navigate()
      .waitUntilLoaded()
      .section.dataTable
      .selectAll()
      .assertBatchMessage('2 items selected')
      .pause(2000)
      .selectAll()
      .pause(2000)
      .selectRow(0)
      .assertBatchMessage('1 item selected')
      .pause(2000)
      .selectRow(1)
      .assertBatchMessage('2 items selected')
      .pause(2000)
      .selectAll()
      .selectRow(0)
      .pause(500)
      .cancelBatchAction()
      .assertNothingSelected()
      .pause(500)
      .selectRow(1)
      .assertBatchMessage('1 item selected')
      .pause(500)
      .batchDeleteItems()
      .pause(500);
    client.page.deleteProjectModal()
      .cancel();
    client.page.projectList()
      .section.dataTable
      .selectRow(1)
      .assertNothingSelected()
      .deleteRow(0)
      .pause(2000)
    client.page.deleteProjectModal()
      .cancel()
      .assertTableRowsShown(2)
      .filterTable('blub', 0)
      .assertTableRowsShown(0)
      .clearFilter()
      .assertTableRowsShown(2)
  },

  CreateApplicationTest: (client) => {
    client.page.overview()
      .navigate()
      .waitUntilLoaded()
      .navToProjects();
    client.page.projectList()
      .waitUntilLoaded()
      .gotoProject('e2e_default_project');
    client.page.componentList()
      .waitUntilLoaded()
      .createApplication();
    client.page.createApplication()
      .waitUntilLoaded()
      .toggleRuntimeSection()
      .toggleEnvironmentSection()
      .assertDeployButtonEnabled(false)
      .addEnvironmentVariable(0, 'bla', 'blub')
      .addEnvironmentVariable(1, 'second', 'winner')
      .assertDeployButtonEnabled(false)
      .deleteEnvironmentVariable(1)
      .deleteEnvironmentVariable(0)
      .setName('e2e-test-app1')
      .setImageUrl('docker.io/agrawals18/helloworld')
      .setMemory('512')
      .setCpu(1)
      .setRequestTimeout(600)
      .setConcurrency(5)
      .setScalingMin(1)
      .setScalingMax(5)
      .assertDeployButtonEnabled(true)
      .clickDeployButton()
    },

  EditApplicationTest: (client) => {
    client.page.overview()
      .navigate()
      .waitUntilLoaded()
      .navToProjects();
    client.page.projectList()
      .waitUntilLoaded()
      .gotoProject('e2e_default_project');
    client.page.componentList()
      .waitUntilLoaded()
      .gotoComponent('e2e-test-app');
    client.page.applicationConfiguration()
      .waitUntilLoaded()
      .assertPageTitle('e2e-test-app')
      .selectRevision('e2e-test-app-sb5gj')
      .clickTestButton()
      .assertInvocationResult('e2e-test-app-sb5gj', 'success', 'Hello World!')
      .clickTabEnvironment()
      .assertEnvironmentVariableCount(0)
      .addEnvironmentVariable(0, 'first', 'winner')
      .assertEnvironmentVariableCount(1)
      .addEnvironmentVariable(1, 'second', 'place')
      .assertEnvironmentVariableCount(2)
      .clickDeployButton()
      .assertEnvironmentVariables([{
        name: 'first',
        value: 'winner',
      }, {
        name: 'second',
        value: 'place',
      }])
      .clickTabRuntime()
      .assertMemory('512')
      .assertCpu('1')
      .assertRequestTimeout('600')
      .assertConcurrency('5')
      .assertScalingMin('1')
      .assertScalingMax('5')
      .clickTabCode()
      .assertImageUrl('docker.io/agrawals18/helloworld')
      .clickNewRevisionButton()
      .setRevisionName(`new-revision-${Date.now().toString(16)}`, true)
      .clickTabRuntime()
      .setMemory(384)
      .clickDeployButton();
  },


  CreateJobDefinitionTest: (client) => {
    const jdName = `e2e-jobdefinition-${Date.now().toString(16)}`;

    client.page.createJobDefinition()
      .navigate()
      .waitUntilLoaded()
      .assertPageTitle('Create job definition')
      .selectProject('e2e_default_project', 'au-syd')
      .selectProjectByIndex(0)
      .toggleRuntimeSection()
      .toggleEnvironmentSection()
      .assertCreateButtonEnabled(false)
      .setName(jdName)
      .setImageUrl('busybox')
      .assertCreateButtonEnabled(true)
      .setCommands(['/bin/sh', '-c', 'date;echo Hello World!'], true)
      .setArguments(['tadaa', 'is', 'better'], true)
      .setMemory('512')
      .setCpu('2')
      .addEnvironmentVariable(0, 'bla', 'blub')
      .addEnvironmentVariable(1, 'second', 'winner')
      .assertCreateButtonEnabled(true)
      .clickCreateButton()
      .waitForCreatingDone()
    client.page.toastMessage()
      .assertToastType('success')
      .closeToast()
    client.page.jobDefinitionConfiguration()
      .waitUntilLoaded()
      .assertPageTitle(jdName)
      .clickTabEnvironment()
      .assertEnvironmentVariables([{
        name: 'bla',
        value: 'blub',
      }, {
        name: 'second',
        value: 'winner',
      }])
      .clickTabRuntime()
      .assertMemory('512')
      .assertCpu('2')
      .clickTabCode()
      .assertImageUrl('busybox')
      .assertCommands(['/bin/sh', '-c', 'date;echo Hello World!'])
      .assertArguments(['tadaa', 'is', 'better'])
      .deleteJobDefinition()
    client.page.deleteJobDefinitionModal()
      .waitUntilLoaded()
      .confirm()
    client.page.toastMessage()
      .assertToastType('success')
      .closeToast();
  },

   ApplicationRevisionTest: (client) => {
     client.page.overview()
       .navigate()
       .waitUntilLoaded()
       .navToProjects();
     client.page.projectList()
       .waitUntilLoaded()
       .gotoProject('e2e_default_project');
     client.page.componentList()
       .waitUntilLoaded()
       .gotoComponent('e2e-default-app');
     client.page.applicationConfiguration()
       .waitUntilLoaded()
       .section.applicationNav.click('@traffic');
     client.page.applicationRevisionsTraffic()
       .waitUntilLoaded()
       .gotoRevision('e2e-default-app-bj9v8')
     client.page.revisionDetailsSidePanel()
       .waitUntilLoaded()
       .toggleEnvVariables()
       .assertImageUrl('docker.io/agrawals18/helloworld')
       .assertMemory('512')
       .assertCpus('0.5')
       .assertTimeout('600')
       .assertConcurrency('5')
       .assertMinScale('1')
       .assertMaxScale('5')
       .assertEnvironmentVariables([
         {
           name: 'first',
           value: 'variable'
         },
         {
           name: 'second',
           value: 'variable'
         }])
       .assertRevisionStatus('Ready')
       .clickCloseBtn()
     client.page.applicationRevisionsTraffic()
       .section.applicationNav.click('@configuration');
     client.page.applicationConfiguration()
       .waitUntilLoaded();
   },
*/

  ShowJobRunInstanceDetailsPage: (client) => {
    client.page.overview()
      .navigate()
      .waitUntilLoaded()
      .navToProjects();
    client.page.projectList()
      .waitUntilLoaded()
      .gotoProject('e2e-dallas-proj');
    client.page.componentList()
      .waitUntilLoaded()
      .navToJobList();
    client.page.jobList()
      .waitUntilLoaded()
      .gotoJob('e2e-dallas-jobdef-jobrun-hx5gm');
    client.page.jobRunDetails()
      .waitUntilLoaded()
      .toggleCommandsSection()
      .toggleArgumentsSection()
      .assertJobRunStatus('Waiting')
      .assertPendingInstances(0)
      .assertRunningInstances(0)
      .assertCompletedInstances(0)
      .assertFailedInstances(0)
      .assertImageUrl('busybox')
      .assertCommands(['/bin/sh', '-c', 'date;'])
      .assertArraySpec('2')
      .assertMemory('512 MiB')
      .assertCpus('2 vCPU')
      .assertRetries('3 retries')
      .assertTimeout('500 sec')
      .assertArguments(['some', 'arguments'])
      .assertEnvironmentVariables([{
        name: 'first',
        value: 'variable',
      }, {
        name: 'second',
        value: 'param',
      },
      ]);
  },

  // 'Cluster Detail': client => client
  //   .ifElementExists('#search-input', () => client.setValue('#search-input', client.globals.clusterName))
  //   .ifElementExists('.bx--search-input', () => client.setValue('.bx--search-input', client.globals.clusterName))
  //   .pause(1000)
  //   .waitForElementVisible(`.armada-table-wrapper td[title="${client.globals.clusterName}"]`, 10 * seconds)
  //   .slowClick(`.armada-table-wrapper td[title="${client.globals.clusterName}"]`)
  //   .waitForElementVisible('.armada-nodes-overview .armada-nodes-states', 1 * minutes)
  //   .slowClick('.bx--breadcrumb-item .bx--link')
  //   .end(),

  // 'Create Cluster': client => client
  //   .waitForElementVisible('.page-filters .bx--btn--primary', 1 * minutes)
  //   .slowClick('.page-filters .bx--btn--primary')
  //   .waitForElementVisible('.armada-flavor-select .bx--tile--selectable:first-of-type, .armada-flavor-select-error', 2 * minutes)
  //   .end(),

  // Overview: client => client
  //   .waitForElementVisible(overview(client), 1 * minutes)
  //   .slowClick(overview(client))
  //   .waitForElementVisible('.overview-pricing', 1 * minutes)
  //   .end(),

  // Registry: client => client
  //   .slowClick(registry(client))
  //   .waitForElementVisible('.armada-registry-quickstart', 1 * minutes)
  //   .end(),

  // 'Policy Settings': client => client
  //   .slowClick(security)
  //   .waitForElementVisible(policySettings(client), 10 * seconds)
  //   .slowClick(policySettings(client))
  //   // .waitForElementVisible('.armada-table-wrapper[data-state="ready"]', 1 * minutes)
  //   .waitForElementVisible('.armada-policy-settings', 1 * minutes)
  //   .end(),

  // 'Helm Charts': client => client
  //   .slowClick(solutions)
  //   .waitForElementVisible(helmCharts(client), 10 * seconds)
  //   .slowClick(helmCharts(client))
  //   .waitForElementVisible('.helm-charts-results-list .bx--tile--clickable:first-of-type', 1 * minutes)
  //   .end(),

  // 'Basic E2E Test': client => client
  //   // Starts on Clusters table
  //   .waitForElementVisible('.armada-table-wrapper, .armada-empty-page', 1 * minutes)
  //   .ifElementExists('#location-filter .filter-reset', () => client
  //     .slowClick('#location-filter .filter-reset'))
  //   .waitForElementVisible('.armada-table-wrapper[data-state="ready"]', 1 * minutes)

  //   // Go to cluster detail
  //   .ifElementExists('#search-input', () => client.setValue('#search-input', client.globals.clusterName))
  //   .ifElementExists('.bx--search-input', () => client.setValue('.bx--search-input', client.globals.clusterName))
  //   .pause(1000)
  //   .waitForElementVisible(`.armada-table-wrapper td[title="${client.globals.clusterName}"]`, 10 * seconds)
  //   .slowClick(`.armada-table-wrapper td[title="${client.globals.clusterName}"]`)
  //   .waitForElementVisible('.armada-nodes-overview .armada-nodes-states', 1 * minutes)
  //   .slowClick('.bx--breadcrumb-item .bx--link')

  //   // Create cluster
  //   .waitForElementVisible('.page-filters .bx--btn--primary', 1 * minutes)
  //   .slowClick('.page-filters .bx--btn--primary')
  //   .waitForElementVisible('.armada-flavor-select .bx--tile--selectable:first-of-type, .armada-flavor-select-error', 2 * minutes)
  //   .back()

  //   // Overview
  //   .waitForElementVisible(overview(client), 1 * minutes)
  //   .slowClick(overview(client))
  //   .waitForElementVisible('.overview-pricing', 1 * minutes)

  //   // Workflows
  //   // .waitForElementVisible(workloads(client), 1 * minutes)
  //   // .slowClick(workloads(client))
  //   // .waitForElementVisible('.armada-table-wrapper[data-state="ready"]', 1 * minutes)

  //   // Registry
  //   .slowClick(registry(client))
  //   .waitForElementVisible('.armada-registry-quickstart', 1 * minutes)

  //   // Policy Settings
  //   .slowClick(security)
  //   .waitForElementVisible(policySettings(client), 10 * seconds)
  //   .slowClick(policySettings(client))
  //   // .waitForElementVisible('.armada-table-wrapper[data-state="ready"]', 1 * minutes)
  //   .waitForElementVisible('.armada-policy-settings', 1 * minutes)

  //   // Helm Charts
  //   .slowClick(solutions)
  //   .waitForElementVisible(helmCharts(client), 10 * seconds)
  //   .slowClick(helmCharts(client))
  //   .waitForElementVisible('.helm-charts-results-list .bx--tile--clickable:first-of-type', 1 * minutes),
};
