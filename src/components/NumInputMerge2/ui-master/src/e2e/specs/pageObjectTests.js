const utils = require('../utils');

const seconds = 1000;
const minutes = 60 * seconds;
const cookies = [];

const preferredTestRegion = 'us-south';
const testLocation = utils.getE2ETestLocation(preferredTestRegion);
const testRegion = utils.getE2ETestRegion(preferredTestRegion);

const defaultProject = {
  name: 'e2e_default_' + testLocation.toLowerCase(),
  location: testLocation,
  region: testRegion,
  resourceGroup: 'efault',  // default or Default, omitting the first character, since we're only using contains()
};

const defaultApplication = {
  name: 'e2e-app-' + testLocation.toLowerCase(),
  imageUrl: 'ibmcom/helloworld',
  envVariables: [
    {
      name: 'first',
      value: 'variable',
    },
    {
      name: 'TARGET',
      value: 'Code Engine',
    },
  ],
  revisionSuffix: 'default-revision',
  memory: '512',
  cpu: '0.5',
  timeout: '600',
  concurrency: '5',
  minScale: '1',
  maxScale: '5',
};

const defaultJobDefinition = {
  name: 'e2e-jobdef-' + testLocation.toLowerCase(),
  imageUrl: 'busybox',
  command: [
    '/bin/sh',
    '-c',
    'date;',
  ],
  arguments: [
    'some',
    'arguments',
  ],
  envVariables: [
    {
      name: 'first',
      value: 'variable',
    },
    {
      name: 'second',
      value: 'parameter',
    },
  ],
  memory: '512',
  cpu: '2',
};

// only covers the overrides on top of the default jobdefinition
const defaultJobRun = {
  memory: '512',
  cpu: '2',
  instances: '1',
  retries: '3',
  timeout: '7200',
};

const pageTitleCreateJobDefinition = 'Create job definition';
const dismissableProjectName = 'e2e_test1_project';
const dismissableAppName = 'e2e-test-app';
const dismissableJobDefName = 'e2e-test-jobdef';
const productName = 'Code Engine';
const projectsBreadcrumb = 'Projects';
const statusReady = 'Ready';
const oneItemSelected = '1 item selected';
const successStatusClassName = 'success';
const succeededText = 'Succeeded';
const defaultAppOutput = 'Hello Code Engine';

const createDefaultProject = (client) => {
  client.page.overview()
    .navigate()
    .waitUntilLoaded()
    .navToProjects();
  client.page.projectList()
    .waitUntilLoaded()
    .createNewProject();
  client.page.createProject()
    .assertCreateButtonEnabled(false)
    .setProjectName(defaultProject.name)
    .selectResourceGroup(defaultProject.resourceGroup)
    .selectLocation(defaultProject.location)
    .assert.containsText('@resourceGroupLabel', defaultProject.resourceGroup)
    .assert.containsText('@regionLabel', defaultProject.location)
    .assertCreateButtonEnabled(true)
    .clickCreateButton();
  client.page.createProjectConfirmationModal()
    .confirm();
  client.page.createProject()
    .waitForLoadingDone();
  client.page.projectList()
    .waitForProjectToBecomeActive(defaultProject.name);
};

const createDefaultApplication = (client) => {
  // prereq: we're on the componentList page and it is already loaded
  client.page.componentList()
    .createApplication()
  const ca = client.page.createApplication();
  ca
    .waitUntilLoaded()
    .toggleRuntimeSection()
    .toggleEnvironmentSection()
    .assertDeployButtonEnabled(false);

  let i = 0;
  for (const env of defaultApplication.envVariables) {
    ca
      .addEnvironmentVariable(i, env.name, env.value);
    i += 1;
  }

  ca
    .assertDeployButtonEnabled(false)
    .setName(defaultApplication.name)
    .setImageUrl(defaultApplication.imageUrl)
    .setMemory(defaultApplication.memory)
    .setCpu(defaultApplication.cpu)
    .setRequestTimeout(defaultApplication.timeout)
    .setConcurrency(defaultApplication.concurrency)
    .setScalingMin(defaultApplication.minScale)
    .setScalingMax(defaultApplication.maxScale)
    .assertDeployButtonEnabled(true)
    .clickDeployButton()
    .pause(5000);
  client.page.applicationConfiguration()
    .waitUntilLoaded()
    .pause(5000)
    .waitForApplicationStatus(statusReady)
    .clickNewRevisionButton()
    .setRevisionName(defaultApplication.revisionSuffix, true)
    .clickDeployButton()
    .assertDeployButtonVisible(false)
    .waitForApplicationStatus(statusReady);
};

const createDefaultJobDefinition = (client) => {
  // prereq: we're on the componentList page and it is already loaded
  client.page.componentList()
    .createJobDefinition()
  const jd = client.page.createJobDefinition();
  jd
    .waitUntilLoaded()
    .assertPageTitle(pageTitleCreateJobDefinition)
    .toggleRuntimeSection()
    .toggleEnvironmentSection()
    .assertCreateButtonEnabled(false)
    .setName(defaultJobDefinition.name)
    .setImageUrl(defaultJobDefinition.imageUrl)
    .assertCreateButtonEnabled(true)
    .setCommands(defaultJobDefinition.command, true)
    .setArguments(defaultJobDefinition.arguments, true)
    .setMemory(defaultJobDefinition.memory)
    .setCpu(defaultJobDefinition.cpu);

  let i = 0;
  for (const env of defaultJobDefinition.envVariables) {
    jd
      .addEnvironmentVariable(i, env.name, env.value);
    i += 1;
  }

  jd
    .assertCreateButtonEnabled(true)
    .clickCreateButton()
    .waitForCreatingDone();
};

const createDefaultJobRun = (client) => {
  // prereq: we're on the job definition details page (Configuration page) and can
  //         therefore trigger a job run right away here
  const jdc = client.page.jobDefinitionConfiguration();
  jdc
    .clickSubmitButton()
  client.page.submitJobSidePanel()
    .waitUntilLoaded()
    .setArraySpec(defaultJobRun.instances)
    .setCpus(defaultJobRun.cpu)
    .setMemory(defaultJobRun.memory)
    .setRetries(defaultJobRun.retries)
    .setJobTimeout(defaultJobRun.timeout)
    .submitJob()
  client.page.jobRunDetails()
    .waitUntilLoaded();
};

/**
 * Checks whether the default project ('e2e_default_project') exists in the region we're going to use
 * for the PageObjectTests (depends on the environment we're running in) and if it doesn't exist,
 * creates it. If it exists, it also checks for the existence of the required default app and jobdefinition.
 *
 * @param client
 */
const setupFixture = (client) => {
  client.page.overview()
    .navigate()
    .waitUntilLoaded()
    .navToProjects();
  const pl = client.page.projectList();
  pl
    .waitUntilLoaded()
    .ifProjectExists(defaultProject.name, () => {
      client
        .perform(() => pl.waitForProjectToBecomeActive(defaultProject.name));
    }, () => {
      client
        .perform(createDefaultProject(client));
    })
    .waitUntilLoaded()
    .gotoProject(defaultProject.name);
  let cl = client.page.componentList();
  cl
    .waitUntilLoaded()
    .ifComponentExists(defaultApplication.name, () => {
      // no-op
    }, () => {
      client
        .perform(createDefaultApplication(client))
        .pause(5000);
    });
  client.page.projectList()
    .navigate()
    .waitUntilLoaded()
    .gotoProject(defaultProject.name);
  cl = client.page.componentList();
  cl
    .waitUntilLoaded()
    .ifComponentExists(defaultJobDefinition.name, () => {
      // no-op
    }, () => {
      client
        .perform(createDefaultJobDefinition(client))
        .pause(5000);
    });
  client.page.projectList()
    .navigate()
    .waitUntilLoaded()
    .gotoProject(defaultProject.name);
  client.page.componentList()
    .navToJobList()
  const jl = client.page.jobList();
  jl
    .waitUntilLoaded()
    .ifJobRunExists(defaultJobDefinition.name, () => {
      // no-op
    },() => {
      jl
        .navToComponentList();
      client.page.componentList()
        .waitUntilLoaded()
        .gotoComponent(defaultJobDefinition.name);
      client.page.jobDefinitionConfiguration()
        .waitUntilLoaded();
      client
        .perform(createDefaultJobRun(client));
    });
};

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

  SetupDefaults: (client) => {
    client
      .perform(setupFixture(client));
  },

  NavigateTests: (client) => {
       client.page.overview()
         .navigate()
         .waitUntilLoaded()
         .assert.urlEquals(`${client.launch_url}${client.globals.proxyRoot}/overview`);
       client.page.projectList()
         .navigate()
         .waitUntilLoaded()
         .assert.urlEquals(`${client.launch_url}${client.globals.proxyRoot}/projects`);
       client.page.cli()
         .navigate()
         .waitUntilLoaded()
         .assert.urlEquals(`${client.launch_url}${client.globals.proxyRoot}/cli`);
       client.page.createComponent()
         .navigate()
         .waitUntilLoaded()
         .assert.urlEquals(`${client.launch_url}${client.globals.proxyRoot}/create/component`);
       client.page.createProject()
         .navigate()
         .waitUntilLoaded()
         .assert.urlEquals(`${client.launch_url}${client.globals.proxyRoot}/create/project`);
       client.page.createApplication()
         .navigate()
         .waitUntilLoaded()
         .assert.urlEquals(`${client.launch_url}${client.globals.proxyRoot}/create/component/application`);
       client.page.createJobDefinition()
         .navigate()
         .waitUntilLoaded()
         .assert.urlEquals(`${client.launch_url}${client.globals.proxyRoot}/create/component/jobdefinition`);
  },

  CreateProjectPage: (client) => {
      client.page.overview()
        .navigate()
        .waitUntilLoaded()
        .navToProjects();
      client.page.projectList()
        .waitUntilLoaded()
        .createNewProject();
      client.page.createProject()
        .waitUntilLoaded()
        .assertCreateButtonEnabled(false)
        .setProjectName(dismissableProjectName)
        .pause(1000)
        .selectResourceGroup(defaultProject.resourceGroup)
        .pause(1000)
        .selectLocation(defaultProject.location)
        .pause(1000)
        .assert.containsText('@resourceGroupLabel', defaultProject.resourceGroup)
        .assert.containsText('@regionLabel', defaultProject.location)
        .assertCreateButtonEnabled(false)  // due to the fact, users can only have one Project per region, it should not be allowed to create another project in Dallas
/* TODO: enable later again, once the 1 Project per region limit is lifted
           .clickCreateButton();
      client.page.createProjectConfirmationModal()
        .waitUntilLoaded()
        .cancel();
      client.page.createProject()
        .clickCancelButton(); */
  },

  ComponentsListPage: (client) => {
    const projName = defaultProject.name;

    client.page.projectList()
      .navigate()
      .waitUntilLoaded()
      .gotoProject(projName);
    client.page.componentList()
      .waitUntilLoaded()
      .assertBreadcrumbs([productName, projectsBreadcrumb])
      .deleteProject();
    client.page.deleteProjectModal()
      .waitUntilLoaded()
      .cancel();
    client.page.componentList()
      .navToJobList();
    client.page.jobList()
      .waitUntilLoaded()
      .assertBreadcrumbs([productName, projectsBreadcrumb])
      .deleteProject();
    client.page.deleteProjectModal()
      .waitUntilLoaded()
      .cancel();
    client.page.jobList()
      .navToComponentList();
    client.page.componentList()
      .waitUntilLoaded();
  },

  TablePageObjectTest: (client) => {
    const projName = defaultProject.name;

    client.page.projectList()
      .navigate()
      .waitUntilLoaded()
      .waitForProjectToBecomeActive(projName)
      .gotoProject(projName);
    client.page.componentList()
      .waitUntilLoaded()
      .section.dataTable
      .selectAll()
      .pause(200)
      .selectAll()
      .selectRow(0)
      .assertBatchMessage(oneItemSelected)
      .pause(200)
      .selectRow(1)
      .pause(200)
      .selectAll()
      .selectRow(0)
      .pause(200)
      .cancelBatchAction()
      .assertNothingSelected()
      .pause(500)
      .selectRow(1)
      .assertBatchMessage(oneItemSelected)
      .batchDeleteItems();
    client.page.deleteComponentsModal()
      .cancel();
    client.page.componentList()
      .section.dataTable
      .selectRow(1)
      .pause(300)  // allow batch ribbon to disappear
      .assertNothingSelected()
      .deleteRow(0)
      .pause(200);
    client.page.deleteComponentsModal()
      .cancel();
    client.page.componentList()
      .section.dataTable
      .filterTable('blub', 0)
      .clearFilter();
  },

  CreateApplicationTest: (client) => {
    client.page.overview()
      .navigate()
      .waitUntilLoaded()
      .navToProjects();
    client.page.projectList()
      .waitUntilLoaded()
      .gotoProject(defaultProject.name);
    client.page.componentList()
      .waitUntilLoaded()
      .createApplication();
    client.page.createApplication()
      .waitUntilLoaded()
      .toggleRuntimeSection()
      .toggleEnvironmentSection()
      .assertDeployButtonEnabled(false)
      .addEnvironmentVariable(0, 'first', 'variable')
      .addEnvironmentVariable(1, 'second', 'param')
      .assertDeployButtonEnabled(false)
      .deleteEnvironmentVariable(1)
      .deleteEnvironmentVariable(0)
      .setName(dismissableAppName)
      .setImageUrl(defaultApplication.imageUrl)
      .setMemory('512')
      .setCpu(1)
      .setRequestTimeout(600)
      .setConcurrency(5)
      .setScalingMin(1)
      .setScalingMax(5)
      .assertDeployButtonEnabled(true)
      .clickCancelButton();
  },

  EditApplicationTest: (client) => {
    const revisionName = `${defaultApplication.name}-${defaultApplication.revisionSuffix}`;
    const envArr = defaultApplication.envVariables.slice();
    envArr.push({
      name: 'plusOne',
      value: 'variable',
    });
    envArr.push({
      name: 'plusTwo',
      value: 'param',
    });

    client.page.overview()
      .navigate()
      .waitUntilLoaded()
      .navToProjects();
    client.page.projectList()
      .waitUntilLoaded()
      .gotoProject(defaultProject.name);
    client.page.componentList()
      .waitUntilLoaded()
      .gotoComponent(defaultApplication.name);
    client.page.applicationConfiguration()
      .waitUntilLoaded()
      .assertPageTitle(defaultApplication.name)
      .waitForApplicationStatus(statusReady)
      .assertBreadcrumbs([productName, projectsBreadcrumb, defaultProject.name])
      .selectRevision(revisionName)
      .clickTestButton()
      .assertInvocationResult(revisionName, successStatusClassName, defaultAppOutput)
      .clickTabEnvironment()
      .assertEnvironmentVariableCount(defaultApplication.envVariables.length)
      .addEnvironmentVariable(defaultApplication.envVariables.length, envArr[envArr.length - 2].name, envArr[envArr.length - 2].value)
      .assertEnvironmentVariableCount(3)
      .addEnvironmentVariable(defaultApplication.envVariables.length + 1, envArr[envArr.length - 1].name, envArr[envArr.length - 1].value)
      .assertEnvironmentVariableCount(defaultApplication.envVariables.length + 2)
      .assertDeployButtonEnabled(true)
      .assertEnvironmentVariables(envArr)
      .clickTabRuntime()
      .assertMemory(defaultApplication.memory)
      .assertCpu(defaultApplication.cpu)
      .assertRequestTimeout(defaultApplication.timeout)
      .assertConcurrency(defaultApplication.concurrency)
      .assertScalingMin(defaultApplication.minScale)
      .assertScalingMax(defaultApplication.maxScale)
      .clickTabCode()
      .assertImageUrl(defaultApplication.imageUrl)
      .clickCancelButton()
      .clickNewRevisionButton()
      .setRevisionName(`new-revision-${Date.now().toString(16)}`, true)
      .clickTabRuntime()
      .setMemory(384)
      .assertDeployButtonEnabled(true)
      .clickCancelButton();
  },

  CreateJobDefinitionTest: (client) => {
    const jdName = `e2e-jobdefinition-${Date.now().toString(16)}`;

    client.page.createJobDefinition()
      .navigate()
      .waitUntilLoaded()
      .assertPageTitle(pageTitleCreateJobDefinition)
      .selectProject(defaultProject.name, defaultProject.region)
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
      .addEnvironmentVariable(0, 'first', 'variable')
      .addEnvironmentVariable(1, 'second', 'param')
      .assertCreateButtonEnabled(true);
  },

  EditAndDeleteJobDefinitionTest: (client) => {
    const jdName = defaultJobDefinition.name;

    client.page.overview()
      .navigate()
      .waitUntilLoaded()
      .navToProjects();
    client.page.projectList()
      .waitUntilLoaded()
      .gotoProject(defaultProject.name);
    client.page.componentList()
      .waitUntilLoaded()
      .gotoComponent(jdName);
    client.page.jobDefinitionConfiguration()
      .waitUntilLoaded()
      .assertPageTitle(jdName)
      .assertBreadcrumbs([productName, projectsBreadcrumb, defaultProject.name])
      .clickTabEnvironment()
      .assertEnvironmentVariables(defaultJobDefinition.envVariables)
      .clickTabRuntime()
      .assertMemory(defaultJobDefinition.memory)
      .assertCpu(defaultJobDefinition.cpu)
      .clickTabCode()
      .assertImageUrl(defaultJobDefinition.imageUrl)
      .assertCommands(defaultJobDefinition.command)
      .assertArguments(defaultJobDefinition.arguments)
      .deleteJobDefinition();
    client.page.deleteJobDefinitionModal()
      .waitUntilLoaded()
      .closeDialog();
  },

  ApplicationRevisionTest: (client) => {
    const revisionName = `${defaultApplication.name}-${defaultApplication.revisionSuffix}`;

    client.page.overview()
      .navigate()
      .waitUntilLoaded()
      .navToProjects();
    client.page.projectList()
      .waitUntilLoaded()
      .gotoProject(defaultProject.name);
    client.page.componentList()
      .waitUntilLoaded()
      .gotoComponent(defaultApplication.name);
    client.page.applicationConfiguration()
      .waitUntilLoaded()
      .section.applicationNav.click('@traffic');
    client.page.applicationRevisionsTraffic()
      .waitUntilLoaded()
      .assertBreadcrumbs([productName, projectsBreadcrumb, defaultProject.name])
      .gotoRevision(revisionName);
    client.page.revisionDetailsSidePanel()
      .waitUntilLoaded()
      .toggleEnvVariables()
      .assertImageUrl(defaultApplication.imageUrl)
      .assertMemory(defaultApplication.memory)
      .assertCpus(defaultApplication.cpu)
      .assertTimeout(defaultApplication.timeout)
      .assertConcurrency(defaultApplication.concurrency)
      .assertMinScale(defaultApplication.minScale)
      .assertMaxScale(defaultApplication.maxScale)
      .assertEnvironmentVariables(defaultApplication.envVariables)
      .assertRevisionStatus(statusReady)
      .clickCloseBtn()
    client.page.applicationRevisionsTraffic()
      .section.applicationNav.click('@configuration');
    client.page.applicationConfiguration()
      .waitUntilLoaded();
  },

  ShowJobRunInstanceDetailsPage: (client) => {
    client.page.overview()
      .navigate()
      .waitUntilLoaded()
      .navToProjects();
    client.page.projectList()
      .waitUntilLoaded()
      .gotoProject(defaultProject.name);
    client.page.componentList()
      .waitUntilLoaded()
      .navToJobList();
    client.page.jobList()
      .waitUntilLoaded()
      .gotoJob(defaultJobDefinition.name);
    client.page.jobRunDetails()
      .waitUntilLoaded()
      .toggleCommandsSection()
      .toggleArgumentsSection()
      .assertJobRunStatus(succeededText)
      .assertPendingInstances(0)
      .assertRunningInstances(0)
      .assertCompletedInstances(1)
      .assertFailedInstances(0)
      .assertImageUrl(defaultJobDefinition.imageUrl)
      .assertCommands(defaultJobDefinition.command)
      .assertArraySpec(`${defaultJobRun.instances}`)
      .assertMemory(`${defaultJobRun.memory} MiB`)
      .assertCpus(`${defaultJobRun.cpu} vCPU`)
      .assertRetries(`${defaultJobRun.retries} retries`)
      .assertTimeout(`${defaultJobRun.timeout} seconds`)
      .assertArguments(defaultJobDefinition.arguments)
      .assertEnvironmentVariables(defaultJobDefinition.envVariables);
  },











  /*     ProjectCreateAndDelete: (client) => {
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
        .assertArraySpec('2 instance(s)')
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
    },*/
};
