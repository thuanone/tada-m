// tslint:disable:max-classes-per-file

/**
 * This module defines all error classes that we use within the Coligo UI (React App + Express App).
 * Each 'block' of errors gets a range of error codes assigned to it. We use 6 digit error codes, with the
 * first 3 digits being available for ranges of error codes and the remaining 3 digits being available to specific
 * error codes within each block/range.
 *
 * All errors inherit from the generic 'Error' class, since it is available on both browsers and within node.js (remember,
 * that this class is being shared among both worlds!).
 *
 * Each error carries a number of common properties defined as protected props with only getters (no setters, as the values
 * should only be set in the constructor). If a specific error requires additional fields, they can be added in the
 * specific error classes.
 *
 * We try to capture stacktraces, if the respective method is available on the Error prototype.
 *
 * Via the causedBy field, error chains can be built and walked up, if necessary.
 */

export function stringify(err: any): string {
  if (!err) {
    return undefined;
  }

  let str = `${(err && err.name) ? err.name : 'Error'}[`;
  if (err._code) {
    str += `code: ${err._code || 'N/A'}, `;
  }
  str += `msg: '${err.message}'`;
  if (err._causedBy) {
    str += `causedBy: ${stringify(err._causedBy)}`;
  }
  str += ']';
  return str;
}

export class GenericUIError extends Error {

  // tslint:disable-next-line:variable-name
  public _code: number;  // code should only be set in constructor by each Error class we define in here

  // tslint:disable-next-line:variable-name
  protected _causedBy: Error;

  get causedBy(): Error {
    return this._causedBy;
  }

  get code(): number {
    return this._code;
  }

  constructor(causedBy?: Error) {
    super();

    this.name = 'GenericUIError';
    this.message = 'Something went wrong in the Coligo UI';
    this._code = 999999;

    this._causedBy = causedBy;
    // when used in React, the captureStackTrace feature might not be available!
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GenericUIError);
    }
  }

  public getCode(): number {
    return this._code;
  }

  public stringify(): string {
    return stringify(this);
  }
}

// 100xxx error range is for general (or unrelated) errors
export class NotYetImplementedError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'NotYetImplementedError';
    this.message = 'Not implemented yet';
    this._code = 100001;  // use the last 3 digits for application error specific codes
  }
}

export class UnknownError extends GenericUIError {
  constructor(causedBy?: Error, message?: string) {
    super(causedBy);

    this.name = 'UnknownError';
    this.message = `unknown error - ${message}`;
    this._code = 100002;  // use the last 3 digits for application error specific codes
  }
}

export class BadInputError extends GenericUIError {
  constructor(param: string, msg?: string) {
    super();

    this.name = 'BadInputError';
    this.message = `Bad input - '${param}'${msg ? `: ${msg}` : ''}'`;
    this._code = 100003;  // use the last 3 digits for application error specific codes
  }
}

export class BadInputPayloadError extends GenericUIError {
  constructor(param: string, msg?: string) {
    super();

    this.name = 'BadInputPayloadError';
    this.message = `Bad payload - '${param}'${msg ? `: ${msg}` : ''}'`;
    this._code = 100004;  // use the last 3 digits for application error specific codes
  }
}

export class KubeApiError extends GenericUIError {
  public details: any;

  constructor(kubeError: object, msg?: string) {
    super();

    this.name = 'KubeApiError';
    this.message = `Received an error from the Kube API ${msg && `- message: ${msg}`}`;
    this.details = kubeError;
    this._code = 100005;  // use the last 3 digits for application error specific codes
  }
}

export class BackendApiError extends GenericUIError {
  public responseContent: any;

  constructor(responseContent: object | string, msg?: string) {
    super();

    this.name = 'BackendApiError';
    this.message = `Received an error from the backend API ${msg && `- message: ${msg}`}`;
    this.responseContent = responseContent;
    this._code = 100006;  // use the last 3 digits for application error specific codes
  }
}

// 101xxx error range is for application related errors

export class FailedToCreateApplicationError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToCreateApplicationError';
    this.message = 'Application could not be created';
    this._code = 101001;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToCreateApplicationBecauseAlreadyExistsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToCreateApplicationBecauseAlreadyExistsError';
    this.message = 'Application could not be created';
    this._code = 101002;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToDeleteApplicationError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToDeleteApplicationError';
    this.message = 'Application could not be deleted';
    this._code = 101003;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetApplicationError extends GenericUIError {
  constructor(causedBy?: Error) {
    super();

    this.name = 'FailedToGetApplicationError';
    this.message = 'Application could not be retrieved from backend';
    this._code = 101004;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetApplicationRevisionsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetApplicationRevisionsError';
    this.message = 'Application revisions could not be retrieved from backend';
    this._code = 101005;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToCreateApplicationRevisionError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToCreateApplicationRevisionError';
    this.message = 'Revision could not be created';
    this._code = 101006;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToDeleteApplicationRevisionError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToDeleteApplicationRevisionError';
    this.message = 'Application revision could not be deleted';
    this._code = 101007;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetApplicationsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetApplicationsError';
    this.message = 'Applications could not be retrieved';
    this._code = 101008;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetApplicationRouteError extends GenericUIError {
  constructor(causedBy?: Error) {
    super();

    this.name = 'FailedToGetApplicationRouteError';
    this.message = 'Application route could not be retrieved from backend';
    this._code = 101009;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetApplicationInstancesError extends GenericUIError {
  constructor(causedBy?: Error) {
    super();

    this.name = 'FailedToGetApplicationInstancesError';
    this.message = 'Application instances could not be retrieved from backend';
    this._code = 101010;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToInvokeApplicationError extends GenericUIError {
  constructor(causedBy?: Error) {
    super();

    this.name = 'FailedToInvokeApplicationError';
    this.message = 'Application could not be invoked properly';
    this._code = 101011;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToCreateApplicationBecauseBadRequestError extends GenericUIError {
  constructor(message: string, causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToCreateApplicationBecauseBadRequestError';
    this.message = `Application could not be created due to a bad request: '${message}'`;
    this._code = 101012;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToCreateApplicationRevisionBecauseBadRequestError extends GenericUIError {
  constructor(message: string, causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToCreateApplicationRevisionBecauseBadRequestError';
    this.message = `Application revision could not be created due to a bad request: '${message}'`;
    this._code = 101013;  // use the last 3 digits for application error specific codes
  }
}

// 102xxx error range is for job related errors

export class FailedToDeleteJobRunError extends GenericUIError {
  constructor(jobRunName?: string, causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToDeleteJobRunError';
    this.message = `JobRun "${jobRunName || '<unknown>'}" could not be deleted`;
    this._code = 102001;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetJobDefsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetJobDefsError';
    this.message = 'Could not retrieve job definitions';
    this._code = 102002;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetJobDefError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetJobDefError';
    this.message = 'Could not retrieve a specific job definition instance';
    this._code = 102003;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetJobRunsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetJobRunsError';
    this.message = 'Could not retrieve job runs';
    this._code = 102004;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetJobRunError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetJobRunError';
    this.message = 'Could not retrieve a specific job run instance';
    this._code = 102005;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToCreateJobDefError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToCreateJobDefError';
    this.message = 'Could not create a job definition instance';
    this._code = 102006;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToUpdateJobDefError extends GenericUIError {
  constructor(jobDefinitionName?: string, causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToUpdateJobDefError';
    this.message = `JobDefinition "${jobDefinitionName || '<unknown>'}" could not be updated`;
    this._code = 102007;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToCreateJobRunError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToCreateJobRunError';
    this.message = 'Could not create a job run instance';
    this._code = 102008;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToDeleteJobDefError extends GenericUIError {
  constructor(jobDefinitionName?: string, causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToDeleteJobDefError';
    this.message = `JobDefinition "${jobDefinitionName || '<unknown>'}" could not be deleted`;
    this._code = 102009;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToCreateJobDefBecauseAlreadyExistsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToCreateJobDefBecauseAlreadyExistsError';
    this.message = 'JobDefinition could not be created';
    this._code = 102010;  // use the last 3 digits for application error specific codes
  }
}

// 103xxx error range is for project related errors
export class FailedToGetProjectsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetProjectsError';
    this.message = 'Could not retrieve projects';
    this._code = 103001;  // use the last 3 digits for project error specific codes
  }
}

export class FailedToGetProjectError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetProjectError';
    this.message = 'Could not retrieve a specific project';
    this._code = 103002;  // use the last 3 digits for project error specific codes
  }
}

export class FailedToAccessResourceControllerDueTokenExpiredError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToAccessResourceControllerDueTokenExpiredError';
    this.message = 'Could not access resource controller, due to expired IAM token';
    this._code = 103003;  // use the last 3 digits for project error specific codes
  }
}

export class FailedToAccessResourceControllerDueBadRequestError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToAccessResourceControllerDueBadRequestError';
    this.message = 'Could not access resource controller, due to incomplete or wrong format of input parameters';
    this._code = 103004;  // use the last 3 digits for project error specific codes
  }
}

export class FailedToAccessResourceControllerDueForbiddenError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToAccessResourceControllerDueForbiddenError';
    this.message = 'Could not access resource controller, due to forbidden access';
    this._code = 103005;  // use the last 3 digits for project error specific codes
  }
}

export class FailedToAccessResourceControllerDueNotFoundError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToAccessResourceControllerDueNotFoundError';
    this.message = 'The requested resource could not be found.';
    this._code = 103006;  // use the last 3 digits for project error specific codes
  }
}

export class FailedToAccessResourceControllerDueConflictError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToAccessResourceControllerDueConflictError';
    this.message = 'The entity is already in the requested state.';
    this._code = 103007;  // use the last 3 digits for project error specific codes
    this._causedBy = causedBy;
  }
}

export class FailedToAccessResourceControllerDueAlreadyRemovedError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToAccessResourceControllerDueAlreadyRemovedError';
    this.message = 'The resource is valid but has been removed already in a previous call';
    this._code = 103008;  // use the last 3 digits for project error specific codes
  }
}

export class FailedToAccessResourceControllerDueServiceUnavailableError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToAccessResourceControllerDueServiceUnavailableError';
    this.message = 'The service is currently unavailable. Your request could not be processed. Wait a few minutes and try again.';
    this._code = 103009;  // use the last 3 digits for project error specific codes
  }
}

export class FailedToAccessResourceControllerDueWrongResponseFormatError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToAccessResourceControllerDueWrongResponseFormatError';
    this.message = 'Could not evaluate the resource controller API response, due to wrong response format';
    this._code = 103010;  // use the last 3 digits for project error specific codes
  }
}

export class FailedToCreateProjectBecauseAlreadyExistsError extends GenericUIError {
  constructor(projectName: string, regionid: string) {
    super();

    this.name = 'FailedToCreateProjectBecauseAlreadyExistsError';
    this.message = `Project could not be created, because there is already a project with the name ${projectName} and that region ${regionid}`;
    this._code = 103011;  // use the last 3 digits for project error specific codes
  }
}

export class FailedToGetResourceGroupsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetResourceGroupsError';
    this.message = 'Could not retrieve resource groups';
    this._code = 103012;  // use the last 3 digits for project error specific codes
  }
}

export class FailedToGetRegionsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetRegionsError';
    this.message = 'Could not retrieve regions';
    this._code = 103013;  // use the last 3 digits for project error specific codes
  }
}

export class FailedToCreateProjectDueToInvalidPlanIdError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToCreateProjectDueToInvalidPlanIdError';
    this.message = 'Project could not be created';
    this._code = 103014;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToCreateProjectError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToCreateProjectError';
    this.message = 'Project could not be created';
    this._code = 103015;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToDeleteProjectError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToDeleteProjectError';
    this.message = 'Project could not be deleted';
    this._code = 103016;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetProjectsNamespaceConfigError extends GenericUIError {
  constructor(projectId: string, regionId: string, causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetProjectsNamespaceConfigError';
    this.message = `Could not retrieve the namespace config of project '${projectId}' in region ${regionId}`;
    this._code = 103017;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetProjectsNamespaceConfigDueToInvalidParametersError extends GenericUIError {
  constructor(projectId: string, regionId: string, causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetProjectsNamespaceConfigDueToInvalidParametersError';
    this.message = `Could not retrieve the namespace config of project '${projectId}' in region ${regionId}`;
    this._code = 103018;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToCreateProjectBecauseLimitReachedError extends GenericUIError {
  constructor(causedBy) {
    super(causedBy);

    this.name = 'FailedToCreateProjectBecauseLimitReachedError';
    this.message = 'Project could not be created, because the max limit for projects in this account has been reached';
    this._code = 103019;  // use the last 3 digits for project error specific codes
  }
}

export class FailedToGetProjectStatusError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetProjectStatusError';
    this.message = 'Could not retrieve the status of a project';
    this._code = 103020;  // use the last 3 digits for project error specific codes
  }
}

export class FailedToGetProjectConsumptionInfoError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetProjectConsumptionInfoError';
    this.message = 'Could not retrieve the consumption information of a project';
    this._code = 103021;  // use the last 3 digits for project error specific codes
  }
}

// 104xxx error range is for project components

export class FailedToGetComponentsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetComponentsError';
    this.message = 'Components could not be retrieved';
    this._code = 104001;  // use the last 3 digits for component error specific codes
  }
}

// 105xxx error range is for general app monitoring and health related errors
export class FailedToGetHealthStatusError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetHealthStatusError';
    this.message = 'Could not retrieve the health status of the application';
    this._code = 105001;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetCacheStatsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetCacheStatsError';
    this.message = 'Could not retrieve the cache statistics of the application';
    this._code = 105002;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetPerfMonitorsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetPerfMonitorsError';
    this.message = 'Could not retrieve the performance monitoring information';
    this._code = 105003;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetAppConfigurationError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetAppConfigurationError';
    this.message = 'Could not retrieve the configuration of the application';
    this._code = 105004;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetColigoContextError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetColigoContextError';
    this.message = 'Could not decompose the given ColigoId';
    this._code = 105005;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToLogClientSideError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToLogClientSideError';
    this.message = 'Could not log the client side error';
    this._code = 105006;  // use the last 3 digits for application error specific codes
  }
}

// 106xxx error range is related to all issues that are related to the Coligo API server
export class FailedToGetTenantStatusError extends GenericUIError {
  constructor(tenenantId: string, causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetTenantStatusError';
    this.message = `Could not retrieve the status of a tenant '${tenenantId}'`;
    this._code = 106001;  // use the last 3 digits for project error specific codes
  }
}

export class FailedToGetNamespaceConfigError extends GenericUIError {
  constructor(namespaceId: string, causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetNamespaceConfigError';
    this.message = `Could not retrieve the config of a namespace '${namespaceId}'`;
    this._code = 106002;  // use the last 3 digits for project error specific codes
  }
}

export class FailedToGetProjectInfoError extends GenericUIError {
  constructor(projectId: string, causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetProjectInfoError';
    this.message = `Could not retrieve the information of a project '${projectId}'`;
    this._code = 106003;  // use the last 3 digits for project error specific codes
  }
}

// 107xxx error range is related to all issues that are related to the Kube secrets

export class FailedToGetSecretsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetSecretsError';
    this.message = 'Secrets could not be retrieved from backend';
    this._code = 107001;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetSecretError extends GenericUIError {
  constructor(causedBy?: Error, secretName?: string) {
    super(causedBy);

    this.name = 'FailedToGetSecretError';
    this.message = `Secret could not be retrieved from backend${secretName ? ` - secretName: '${secretName}'` : ''}`;
    this._code = 107002;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToCreateSecretError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToCreateSecretError';
    this.message = 'Secret could not be created';
    this._code = 107003;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToCreateSecretBecauseAlreadyExistsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToCreateSecretBecauseAlreadyExistsError';
    this.message = 'Secret could not be created because a secret with the same name already exists';
    this._code = 107004;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToDeleteSecretError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToDeleteSecretError';
    this.message = 'Secret could not be deleted from backend';
    this._code = 107005;  // use the last 3 digits for application error specific codes
  }
}

export class UnsupportedSecretTypeError extends GenericUIError {
  constructor(secretName: string, secretType: string, causedBy?: Error) {
    super(causedBy);

    this.name = 'UnsupportedSecretTypeError';
    this.message = `The type '${secretType}' of secret '${secretName}' is not supported in this context.`;
    this._code = 107006;  // use the last 3 digits for application error specific codes
  }
}

// 108xxx error range is related to all issues that are related to the Kube ConfigMaps

export class FailedToGetConfigMapsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetConfigMapsError';
    this.message = 'ConfigMaps could not be retrieved from backend';
    this._code = 108001;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetConfigMapError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetConfigMapError';
    this.message = 'ConfigMap could not be retrieved from backend';
    this._code = 108002;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToCreateConfigMapError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToCreateConfigMapError';
    this.message = 'ConfigMap could not be created';
    this._code = 108003;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToCreateConfigMapBecauseAlreadyExistsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToCreateConfigMapBecauseAlreadyExistsError';
    this.message = 'ConfigMap could not be created because a config map with the same name already exists';
    this._code = 108004;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToDeleteConfigMapError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToDeleteConfigMapError';
    this.message = 'ConfigMap could not be deleted from backend';
    this._code = 108005;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetConfigItemsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetConfigItemsError';
    this.message = 'Config items could not be retrieved';
    this._code = 108006;  // use the last 3 digits for component error specific codes
  }
}

// 109xxx error range is related to all issues that are related to the SourceToImage (Build)

export class FailedToGetBuildsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super();

    this.name = 'FailedToGetBuildsError';
    this.message = 'Builds could not be retrieved from backend';
    this._code = 109001;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetBuildError extends GenericUIError {
  constructor(name: string, causedBy?: Error) {
    super();

    this.name = 'FailedToGetBuildError';
    this.message = `Build '${name}' could not be retrieved from backend`;
    this._code = 109002;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToCreateBuildError extends GenericUIError {
  constructor(causedBy?: Error) {
    super();

    this.name = 'FailedToCreateBuildError';
    this.message = 'Build could not be created';
    this._code = 109003;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToCreateBuildBecauseAlreadyExistsError extends GenericUIError {
  constructor(name: string, causedBy?: Error) {
    super();

    this.name = 'FailedToCreateBuildBecauseAlreadyExistsError';
    this.message = 'Build could not be created because a config map with the same name already exists';
    this._code = 109004;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToUpdateBuildError extends GenericUIError {
  constructor(name: string, causedBy?: Error) {
    super();

    this.name = 'FailedToUpdateBuildError';
    this.message = `Build '${name}' could not be updated`;
    this._code = 109005;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToDeleteBuildError extends GenericUIError {
  constructor(name: string, causedBy?: Error) {
    super();

    this.name = 'FailedToDeleteBuildError';
    this.message = `Build '${name}' could not be deleted from backend`;
    this._code = 109006;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetBuildRunsError extends GenericUIError {
  constructor(causedBy?: Error) {
    super();

    this.name = 'FailedToGetBuildRunsError';
    this.message = 'BuildRuns could not be retrieved from backend';
    this._code = 109007;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetBuildRunError extends GenericUIError {
  constructor(name: string, causedBy?: Error) {
    super();

    this.name = 'FailedToGetBuildRunError';
    this.message = `BuildRun '${name}' could not be retrieved from backend`;
    this._code = 109008;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToCreateBuildRunError extends GenericUIError {
  constructor(causedBy?: Error) {
    super();

    this.name = 'FailedToCreateBuildRunError';
    this.message = 'BuildRun could not be created';
    this._code = 109009;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToDeleteBuildRunError extends GenericUIError {
  constructor(name: string, causedBy?: Error) {
    super();

    this.name = 'FailedToDeleteBuildRunError';
    this.message = `BuildRun '${name}' could not be deleted from backend`;
    this._code = 109010;  // use the last 3 digits for application error specific codes
  }
}

// 110xxx error range is related to all issues that are related to the IBM container registry errors (ICR)

export class FailedToListIcrImagesError extends GenericUIError {
  constructor(causedBy?: Error) {
    super();

    this.name = 'FailedToListIcrImagesError';
    this.message = 'Failed to list ICR images';
    this._code = 110001;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToListIcrNamespacesError extends GenericUIError {
  constructor(causedBy?: Error) {
    super();

    this.name = 'FailedToListIcrNamespacesError';
    this.message = 'Failed to list ICR namespaces';
    this._code = 110002;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToListRegistryNamespacesError extends GenericUIError {
  constructor(causedBy?: Error) {
    super();

    this.name = 'FailedToListRegistryNamespacesError';
    this.message = 'Failed to list registry namespaces';
    this._code = 110003;  // use the last 3 digits for application error specific codes
  }
}

// 111xxx error range is related to all issues that are related to IAM errors (IAM)

export class FailedToGetIAMTokensForAPIKeyError extends GenericUIError {
  constructor(causedBy?: Error) {
    super();

    this.name = 'FailedToGetIAMTokensForAPIKeyError';
    this.message = 'Failed to create IAM tokens for API key';
    this._code = 111001;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetDetailsOfAPIKeyError extends GenericUIError {
  constructor(causedBy?: Error) {
    super();

    this.name = 'FailedToGetDetailsOfAPIKeyError';
    this.message = 'Failed to get details of API key';
    this._code = 111002;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetDelegatedRefreshTokenError extends GenericUIError {
  constructor(causedBy?: Error) {
    super();

    this.name = 'FailedToGetDelegatedRefreshTokenError';
    this.message = 'Failed to a new delegated refresh token';
    this._code = 111003;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetIAMTokensError extends GenericUIError {
  constructor(causedBy?: Error) {
    super();

    this.name = 'FailedToGetIAMTokensError';
    this.message = 'Failed to a new set of IAM tokens';
    this._code = 111004;  // use the last 3 digits for application error specific codes
  }
}

// 112xxx error range is related to all issues that are related to container registries

export class FailedToListRegistryServersError extends GenericUIError {
  constructor(projectId: string, causedBy?: Error) {
    super();

    this.name = 'FailedToListRegistryServersError';
    this.message = `Failed to list all registry servers of project ${projectId}`;
    this._code = 112001;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetRegistryAccessDetailsError extends GenericUIError {
  constructor(projectId: string, registryId: string, causedBy?: Error) {
    super();

    this.name = 'FailedToGetRegistryAccessDetailsError';
    this.message = `Failed to get access details for registry ${registryId} in project '${projectId}'`;
    this._code = 112002;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToListSecretsThatPointToServerError extends GenericUIError {
  constructor(projectId: string, serverDomain: string, causedBy?: Error) {
    super();

    this.name = 'FailedToListSecretsThatPointToServerError';
    this.message = `Failed to to list all secrets of project '${projectId}' that point to server '${serverDomain}'`;
    this._code = 112003;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToListNamespacesOfServerDomainError extends GenericUIError {
  constructor(projectId: string, serverDomain: string, causedBy?: Error) {
    super();

    this.name = 'FailedToListNamespacesOfServerDomainError';
    this.message = `Failed to to list all registry namespaces of project '${projectId}' that point to server '${serverDomain}'`;
    this._code = 112004;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToListNamespacesOfRegistryError extends GenericUIError {
  constructor(projectId: string, registryId: string, causedBy?: Error) {
    super();

    this.name = 'FailedToListNamespacesOfRegistryError';
    this.message = `Failed to to list all namespaces of registry '${registryId}' in project '${projectId}'`;
    this._code = 112005;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToListImagesOfRegistryError extends GenericUIError {
  constructor(projectId: string, registryId: string, causedBy?: Error) {
    super();

    this.name = 'FailedToListImagesOfRegistryError';
    this.message = `Failed to to list all images of registry '${registryId}' in project '${projectId}'`;
    this._code = 112006;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToListRepositoriesOfRegistryError extends GenericUIError {
  constructor(projectId: string, registryId: string, causedBy?: Error) {
    super();

    this.name = 'FailedToListRepositoriesOfRegistryError';
    this.message = `Failed to to list all repositories of registry '${registryId}' in project '${projectId}'`;
    this._code = 112007;  // use the last 3 digits for application error specific codes
  }
}

// 113xxx error range is related to all issues that are related to DockerHub

export class FailedToGetDockerHubAccessTokenError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetDockerHubAccessTokenError';
    this.message = 'Failed to get an access token for docker hub';
    this._code = 113001; // use the last 3 digits for application error specific codes
  }
}

export class FailedToGetDockerHubRegistryAccessDetailsError extends GenericUIError {
  constructor(projectId: string, registryId: string, causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToGetDockerHubRegistryAccessDetailsError';
    this.message = `Failed to get access details for registry ${registryId} in project '${projectId}'`;
    this._code = 113002;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToListDockerHubNamespacesError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToListDockerHubNamespacesError';
    this.message = 'Failed to list DockerHub namespaces';
    this._code = 113003;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToListDockerHubRepositoriesError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToListDockerHubRepositoriesError';
    this.message = 'Failed to list DockerHub repositories';
    this._code = 113004;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToListDockerHubImagesError extends GenericUIError {
  constructor(causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToListDockerHubImagesError';
    this.message = 'Failed to list DockerHub images';
    this._code = 113005;  // use the last 3 digits for application error specific codes
  }
}

export class FailedToListImagesOfDockerHubRegistryError extends GenericUIError {
  constructor(projectId: string, registryId: string, causedBy?: Error) {
    super(causedBy);

    this.name = 'FailedToListImagesOfRegistryError';
    this.message = `Failed to to list all images of docker hub registry '${registryId}' in project '${projectId}'`;
    this._code = 112006;  // use the last 3 digits for application error specific codes
  }
}

// ... add more Error classes here ...
