import win from './window';

const proxyRoot = window.armada.config.proxyRoot;

const getParam = (name) => {
  const n = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp(`[\\?&]${n}=([^&#]*)`);
  const results = regex.exec(win.get('location.search'));
  return (results === null || results[1] === 'undefined') ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

const getDocsLink = (id: string): string => {
  return window.armada.config.docs[id];
};

const toBuildDetail = (regionId, projectId, buildId) => `${proxyRoot}project/${regionId}/${projectId}/build/${buildId}/configuration`;
const toCli = () => `${proxyRoot}cli`;
const toCreateBuild = () => `${proxyRoot}create/build`;
const toCreateComponent = () => `${proxyRoot}create/component`;
const toCreateProject = () => `${proxyRoot}create/project`;
const toCreateApplication = () => `${proxyRoot}create/component/application`;
const toCreateJobDefinition = () => `${proxyRoot}create/component/jobdefinition`;
const toCreateBuildInProject = (regionId, projectId) => `${proxyRoot}create/project/${regionId}/${projectId}/build`;
const toCreateComponentInProject = (regionId, projectId) => `${proxyRoot}create/project/${regionId}/${projectId}/component`;
const toCreateApplicationInProject = (regionId, projectId) => `${proxyRoot}create/project/${regionId}/${projectId}/application`;
const toCreateConfigInProject = (regionId, projectId) => `${proxyRoot}create/project/${regionId}/${projectId}/config`;
const toCreateJobDefinitionInProject = (regionId, projectId) => `${proxyRoot}create/project/${regionId}/${projectId}/jobdefinition`;
const toCreateRegistryInProject = (regionId, projectId) => `${proxyRoot}create/project/${regionId}/${projectId}/registry`;
const toHealthCaches = () => `${proxyRoot}health/caches`;
const toHealthPerformance = () => `${proxyRoot}health/performance`;
const toHealthStatus = () => `${proxyRoot}health/status`;
const toHealthTroubleshooting = () => `${proxyRoot}health/troubleshooting`;
const toProjectDetail = (regionId, projectId) => `${proxyRoot}project/${regionId}/${projectId}/overview`;
const toProjectDetailApplications = (regionId, projectId) => `${proxyRoot}project/${regionId}/${projectId}/applications`;
const toProjectDetailBuilds = (regionId, projectId) => `${proxyRoot}project/${regionId}/${projectId}/builds`;
const toProjectDetailComponents = (regionId, projectId, filterText?: string) => `${proxyRoot}project/${regionId}/${projectId}/components${filterText ? `?filter=${filterText}` : ''}`;
const toProjectDetailConfig = (regionId, projectId) => `${proxyRoot}project/${regionId}/${projectId}/config`;
const toProjectDetailRegistries = (regionId, projectId) => `${proxyRoot}project/${regionId}/${projectId}/registries`;
const toProjectDetailJobs = (regionId, projectId) => `${proxyRoot}project/${regionId}/${projectId}/jobs`;
const toProjectDetailJobRuns = (regionId, projectId) => `${proxyRoot}project/${regionId}/${projectId}/jobruns`;
const toJobDefinitionDetail = (regionId, projectId, jobDefinitionId) => `${proxyRoot}project/${regionId}/${projectId}/jobdefinition/${jobDefinitionId}/configuration`;
const toJobDefinitionLogs = (regionId, projectId, jobDefinitionId) => `${proxyRoot}project/${regionId}/${projectId}/jobdefinition/${jobDefinitionId}/logs`;
const toJobRunDetail = (regionId, projectId, jobRunId) => `${proxyRoot}project/${regionId}/${projectId}/job/${jobRunId}`;
const toApplicationDetail = (regionId, projectId, applicationId) => `${proxyRoot}project/${regionId}/${projectId}/application/${applicationId}/configuration`;
const toApplicationDetailInstances = (regionId, projectId, applicationId) => `${proxyRoot}project/${regionId}/${projectId}/application/${applicationId}/instances`;
const toApplicationDetailTraffic = (regionId, projectId, applicationId) => `${proxyRoot}project/${regionId}/${projectId}/application/${applicationId}/traffic`;
const toProjectList = () => `${proxyRoot}projects`;
const toGettingStartedOverview = () => `${proxyRoot}overview`;

export default {
  getDocsLink,
  getParam,
  toApplicationDetail,
  toApplicationDetailInstances,
  toApplicationDetailTraffic,
  toBuildDetail,
  toCli,
  toCreateApplication,
  toCreateApplicationInProject,
  toCreateBuild,
  toCreateBuildInProject,
  toCreateComponent,
  toCreateComponentInProject,
  toCreateConfigInProject,
  toCreateJobDefinition,
  toCreateJobDefinitionInProject,
  toCreateProject,
  toCreateRegistryInProject,
  toGettingStartedOverview,
  toHealthCaches,
  toHealthPerformance,
  toHealthStatus,
  toHealthTroubleshooting,
  toJobDefinitionDetail,
  toJobDefinitionLogs,
  toJobRunDetail,
  toProjectDetail,
  toProjectDetailApplications,
  toProjectDetailBuilds,
  toProjectDetailComponents,
  toProjectDetailConfig,
  toProjectDetailJobs,
  toProjectDetailJobRuns,
  toProjectDetailRegistries,
  toProjectList,
};
