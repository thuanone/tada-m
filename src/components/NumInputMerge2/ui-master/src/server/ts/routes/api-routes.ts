// Router definitions for api calls to knative
import * as express from 'express';
import * as application from '../endpoints/application-endpoints';
import * as build from '../endpoints/build-endpoints';
import * as component from '../endpoints/component-endpoints';
import * as config from '../endpoints/config-endpoints';
import * as confmap from '../endpoints/confmap-endpoints';
import * as containerRegistry from '../endpoints/container-registry-endpoints';
import * as job from '../endpoints/job-endpoints';
import * as project from '../endpoints/project-endpoints';
import * as broker from '../endpoints/broker-endpoints';
import * as secret from '../endpoints/secret-endpoints';
import { verifyCsrfToken } from '../utils/csrf-utils';
import { setClgContext } from '../utils/request-context-utils';
import { verifyFeatureFlag } from '../utils/routes-utils';
import {
  getAppInvokeValidationRules,
  getApplicationCreationValidationRules,
  getApplicationRevisionCreationValidationRules,
  getBuildCreationValidationRules,
  getBuildRunCreationValidationRules,
  getBuildUpdateValidationRules,
  getConfMapCreationValidationRules,
  getJobDefCreationValidationRules,
  getJobDefUpdateValidationRules,
  getJobRunCreationValidationRules,
  getProjectCreationValidationRules,
  getSecretCreationValidationRules,
  getUrlValidationRules,
  validate,
} from '../utils/validation-utils';

const router = express.Router();
const regionPath = '/v1/region';

/* **** -------------------- **** */
/* **** BROKER               **** */
/* **** ==================== **** */
const verifyLiftLimitationsFeatureFlag = (req, res, next) => {
  verifyFeatureFlag('coligo-ui-features-alpha', req, res, next);
};
router.get('/v1/region/:regionId/broker/lift-limitations', setClgContext('broker::lift-limitations'), verifyLiftLimitationsFeatureFlag, getUrlValidationRules(), validate, broker.getLiftedLimitations);

/* **** --------------- **** */
/* **** RESOURCE GROUPS **** */
/* **** =============== **** */
router.get('/v1/resource-groups', setClgContext('project::list-resource-groups'), project.listResourceGroups);

/* **** --------------- **** */
/* **** REGIONS **** */
/* **** =============== **** */
router.get('/v1/regions', setClgContext('project::list-regions'), project.listRegions);

/* **** --------------- **** */
/* **** PROJECTS        **** */
/* **** =============== **** */
router.post('/v1/project', setClgContext('project::create-project'), verifyCsrfToken, getProjectCreationValidationRules(), validate, project.createProject);
router.get(`${regionPath}/:regionId/projects`, setClgContext('project::list-projects'), getUrlValidationRules(), validate, project.listProjects);
router.get(`${regionPath}/:regionId/project/:projectId`, setClgContext('project::get-project'), getUrlValidationRules(), validate, project.getProject);
router.get(`${regionPath}/:regionId/project/:projectId/status`, setClgContext('project::get-project-status'), getUrlValidationRules(), validate, project.getProjectStatus);
router.get(`${regionPath}/:regionId/project/:projectId/consumption`, setClgContext('project::get-project-consumption'), getUrlValidationRules(), validate, project.getProjectConsumption);
router.get(`${regionPath}/all/projects`, setClgContext('projects::get-all-projects'), getUrlValidationRules(), validate, project.getAllProjects);
router.delete(`${regionPath}/:regionId/project/:projectId`, setClgContext('project::delete-project'), verifyCsrfToken, getUrlValidationRules(), validate, project.deleteProject);

/* **** --------------- **** */
/* **** APPLICATIONS    **** */
/* **** =============== **** */
router.get(`${regionPath}/:regionId/project/:projectId/applications`, setClgContext('application::list-applications'), getUrlValidationRules(), validate, application.listApplications);
router.get(`${regionPath}/:regionId/project/:projectId/application/:applicationId`, setClgContext('application::get-application'), getUrlValidationRules(), validate, application.getApplication);
router.delete(`${regionPath}/:regionId/project/:projectId/application/:applicationId`, setClgContext('application::delete-application'), verifyCsrfToken, validate, application.deleteApplication);
router.post(`${regionPath}/:regionId/project/:projectId/application`, setClgContext('application::create-application'), verifyCsrfToken, getApplicationCreationValidationRules(), validate, application.createApplication);
router.post(`${regionPath}/:regionId/project/:projectId/application/:applicationId/invoke`, setClgContext('application::invoke-application'), verifyCsrfToken, getAppInvokeValidationRules(), validate, application.invokeApplication);
router.get(`${regionPath}/:regionId/project/:projectId/application/:applicationId/revisions`, setClgContext('application::list-application-revisions'), getUrlValidationRules(), validate, application.listApplicationRevisions);
router.get(`${regionPath}/:regionId/project/:projectId/application/:applicationId/instances`, setClgContext('application::list-application-instances'), getUrlValidationRules(), validate, application.listApplicationInstances);
router.post(`${regionPath}/:regionId/project/:projectId/application/:applicationId/revision`, setClgContext('application::create-application-revision'), verifyCsrfToken, getApplicationRevisionCreationValidationRules(), validate, application.createApplicationRevision);
router.get(`${regionPath}/:regionId/project/:projectId/application/:applicationId/route`, setClgContext('application::get-application-route'), getUrlValidationRules(), validate, application.getApplicationRoute);

/* **** --------------- **** */
/* **** JOB DEFINITIONS **** */
/* **** =============== **** */
router.post(`${regionPath}/:regionId/project/:projectId/jobdefinition`, setClgContext('jobs::create-jobdef'), verifyCsrfToken, getJobDefCreationValidationRules(), validate, job.createJobDefinition);
router.get(`${regionPath}/:regionId/project/:projectId/jobdefinition/:jobdefinitionId`, setClgContext('jobs::get-jobdef'), getUrlValidationRules(), validate, job.getJobDefinition);
router.get(`${regionPath}/:regionId/project/:projectId/jobdefinitions`, setClgContext('jobs::list-jobdefs'), getUrlValidationRules(), validate, job.listJobDefinitions);
router.delete(`${regionPath}/:regionId/project/:projectId/jobdefinition/:jobdefinitionId`, setClgContext('jobs::delete-jobdef'), verifyCsrfToken, getUrlValidationRules(), validate, job.deleteJobDefinition);
router.put(`${regionPath}/:regionId/project/:projectId/jobdefinition/:jobdefinitionId`, setClgContext('jobs::update-jobdef'), verifyCsrfToken, getJobDefUpdateValidationRules(), validate, job.updateJobDefinition);

/* **** -------- **** */
/* **** JOB RUNS **** */
/* **** ======== **** */
router.post(`${regionPath}/:regionId/project/:projectId/job`, setClgContext('jobs::create-jobrun'), verifyCsrfToken, getJobRunCreationValidationRules(), validate, job.createJobRun);
router.get(`${regionPath}/:regionId/project/:projectId/job/:jobrun`, setClgContext('jobs::get-jobrun'), getUrlValidationRules(), validate, job.getJobRun);
router.get(`${regionPath}/:regionId/project/:projectId/jobs`, setClgContext('jobs::list-jobruns'), getUrlValidationRules(), validate, job.listJobRuns);
router.delete(`${regionPath}/:regionId/project/:projectId/job/:jobrun`, setClgContext('jobs::delete-jobrun'), verifyCsrfToken, getUrlValidationRules(), validate, job.deleteJobRun);

/* **** ---------- **** */
/* **** COMPONENTS **** */
/* **** ========== **** */
router.get(`${regionPath}/:regionId/project/:projectId/components`, setClgContext('component::list-components'), getUrlValidationRules(), validate, component.listComponents);

/* **** ------------------------------ **** */
/* **** CONFIG (Secrets and ConfigMap) **** */
/* **** ============================== **** */
const verifySecretsFeatureFlag = (req, res, next) => {
  verifyFeatureFlag('coligo-ui-feature-secrets', req, res, next);
};
const verifyEnvV2FeatureFlag = (req, res, next) => {
  verifyFeatureFlag('coligo-ui-feature-env-v2', req, res, next);
};
router.post(`${regionPath}/:regionId/project/:projectId/secret`, setClgContext('secrets::create-secret'), verifySecretsFeatureFlag, verifyCsrfToken, getSecretCreationValidationRules(), validate, secret.createSecret);
router.get(`${regionPath}/:regionId/project/:projectId/secret/:secretId`, setClgContext('secrets::get-secret'), verifySecretsFeatureFlag, getUrlValidationRules(), validate, secret.getSecret);
router.get(`${regionPath}/:regionId/project/:projectId/secrets`, setClgContext('secrets::list-secrets'), verifySecretsFeatureFlag, getUrlValidationRules(), validate, secret.listSecrets);
router.delete(`${regionPath}/:regionId/project/:projectId/secret/:secretId`, setClgContext('secrets::delete-secret'), verifySecretsFeatureFlag, verifyCsrfToken, getUrlValidationRules(), validate, secret.deleteSecret);
router.post(`${regionPath}/:regionId/project/:projectId/confmap`, setClgContext('confmap::create-confmap'), verifyEnvV2FeatureFlag, verifyCsrfToken, getConfMapCreationValidationRules(), validate, confmap.createConfigMap);
router.get(`${regionPath}/:regionId/project/:projectId/confmap/:confMapId`, setClgContext('confmap::get-confmap'), verifyEnvV2FeatureFlag, getUrlValidationRules(), validate, confmap.getConfigMap);
router.get(`${regionPath}/:regionId/project/:projectId/confmaps`, setClgContext('confmap::list-confmaps'), verifyEnvV2FeatureFlag, getUrlValidationRules(), validate, confmap.listConfigMaps);
router.delete(`${regionPath}/:regionId/project/:projectId/confmap/:confMapId`, setClgContext('confmap::delete-confmap'), verifyEnvV2FeatureFlag, verifyCsrfToken, getUrlValidationRules(), validate, confmap.deleteConfigMap);
router.get(`${regionPath}/:regionId/project/:projectId/configitems`, setClgContext('config::list-configitems'), verifyEnvV2FeatureFlag, getUrlValidationRules(), validate, config.listConfigItems);

/* **** ---------- **** */
/* **** Src2Img    **** */
/* **** ========== **** */
const verifySrc2ImgFeatureFlag = (req, res, next) => {
  verifyFeatureFlag('coligo-ui-feature-s2i', req, res, next);
};
router.post(`${regionPath}/:regionId/project/:projectId/build`, setClgContext('builds::create-build'), verifySrc2ImgFeatureFlag, verifyCsrfToken, getBuildCreationValidationRules(), validate, build.createBuild);
router.get(`${regionPath}/:regionId/project/:projectId/build/:buildId`, setClgContext('builds::get-build'), verifySrc2ImgFeatureFlag, getUrlValidationRules(), validate, build.getBuild);
router.get(`${regionPath}/:regionId/project/:projectId/builds`, setClgContext('builds::list-builds'), verifySrc2ImgFeatureFlag, getUrlValidationRules(), validate, build.listBuilds);
router.delete(`${regionPath}/:regionId/project/:projectId/build/:buildId`, setClgContext('builds::delete-build'), verifySrc2ImgFeatureFlag, verifyCsrfToken, getUrlValidationRules(), validate, build.deleteBuild);
router.put(`${regionPath}/:regionId/project/:projectId/build/:buildId`, setClgContext('builds::update-build'), verifySrc2ImgFeatureFlag, verifyCsrfToken, getBuildUpdateValidationRules(), validate, build.updateBuild);
router.post(`${regionPath}/:regionId/project/:projectId/buildrun`, setClgContext('builds::create-buildrun'), verifySrc2ImgFeatureFlag, verifyCsrfToken, getBuildRunCreationValidationRules(), validate, build.createBuildRun);
router.get(`${regionPath}/:regionId/project/:projectId/buildrun/:buildRunId`, setClgContext('builds::get-buildrun'), verifySrc2ImgFeatureFlag, getUrlValidationRules(), validate, build.getBuildRun);
router.get(`${regionPath}/:regionId/project/:projectId/buildruns`, setClgContext('builds::list-buildruns'), verifySrc2ImgFeatureFlag, getUrlValidationRules(), validate, build.listBuildRuns);
router.get(`${regionPath}/:regionId/project/:projectId/buildruns/:buildId`, setClgContext('builds::list-buildruns'), verifySrc2ImgFeatureFlag, getUrlValidationRules(), validate, build.listBuildRuns);
router.delete(`${regionPath}/:regionId/project/:projectId/buildrun/:buildRunId`, setClgContext('builds::delete-buildrun'), verifySrc2ImgFeatureFlag, verifyCsrfToken, getUrlValidationRules(), validate, build.deleteBuildRun);

/* **** -------------------- **** */
/* **** Container Registries **** */
/* **** ==================== **** */
const verifyContainerRegistriesFeatureFlag = (req, res, next) => {
  verifyFeatureFlag('coligo-ui-feature-icr', req, res, next);
};
router.get(`${regionPath}/:regionId/project/:projectId/registries`, setClgContext('registries::list-registries'), verifyContainerRegistriesFeatureFlag, getUrlValidationRules(), validate, containerRegistry.listRegistries);
router.get(`${regionPath}/:regionId/project/:projectId/registry-server/:registryServer/namespaces`, setClgContext('registries::list-registryserver-namespaces'), verifyContainerRegistriesFeatureFlag, getUrlValidationRules(), validate, containerRegistry.listNamespacesOfRegistry);
router.get(`${regionPath}/:regionId/project/:projectId/registry/:registryId/namespaces`, setClgContext('registries::list-registry-namespaces'), verifyContainerRegistriesFeatureFlag, getUrlValidationRules(), validate, containerRegistry.listNamespaces);
router.get(`${regionPath}/:regionId/project/:projectId/registry/:registryId/namespace/:namespaceId/repositories`, setClgContext('registries::list-repositories-per-namespace'), verifyContainerRegistriesFeatureFlag, getUrlValidationRules(), validate, containerRegistry.listRepositories);
router.get(`${regionPath}/:regionId/project/:projectId/registry/:registryId/namespace/:namespaceId/repository/:repositoryId/images`, setClgContext('registries::list-images-per-repository-per-namespace'), verifyContainerRegistriesFeatureFlag, getUrlValidationRules(), validate, containerRegistry.listImages);

module.exports = router;
