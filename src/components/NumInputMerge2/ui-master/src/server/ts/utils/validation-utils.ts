import { body, param, query, validationResult } from 'express-validator';

import * as commonModel from '../../../common/model/common-model';
import * as memoryUtils from '../../../common/utils/memory-utils';
import * as coligoValidatorConfig from '../../../common/validator/coligo-validator-config';
import * as commonValidator from '../../../common/validator/common-validator';
import { FloatValidator } from '../../../common/validator/float-validator';
import { MemoryValidator } from '../../../common/validator/memory-validator';
import { NumberValidator } from '../../../common/validator/number-validator';
import { TextValidator } from '../../../common/validator/text-validator';
import * as monitoringModel from '../model/monitoring-model';
import { getClgContext, getClgMonitor, getClgRoute } from '../utils/request-context-utils';
import * as coligoUtils from './coligo-utils';
import * as middlewareUtils from './middleware-utils';

import * as errors from '../../../common/Errors';

import * as loggerUtil from '../utils/logger-utils';
const logger = loggerUtil.getLogger('clg-ui:router:validation');

const floatValidator: commonValidator.IClgFieldValidator = new FloatValidator();
const memoryValidator: commonValidator.IClgFieldValidator = new MemoryValidator();
const numberValidator: commonValidator.IClgFieldValidator = new FloatValidator();
const textValidator: commonValidator.IClgFieldValidator = new TextValidator();

export const getUrlValidationRules = () => {
  return [

    //
    // validate the region by checking the current configuration
    param('regionId').optional().custom((value: string) => {
      return coligoUtils.isMultitenantRegion(value) || value === 'all';
    }),

    //
    // validate the projectId by checking if it is a valid UUID
    param('projectId').optional().isUUID(),

    //
    // validate the applicationId by checking if its name matches the expectations (length, regexp, ...)
    param('applicationId').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.application.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validate the jobdefinitionId by checking if its name matches the expectations (length, regexp, ...)
    param('jobdefinitionId').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.job.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validate the jobrun by checking if its name matches the expectations
    param('jobrun').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.job.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validate the jobdefinition name by checking if its name matches the expectations
    query('jobDefinitionName').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.job.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validate the secretId by checking if its name matches the expectations
    param('secretId').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.secret.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validate the secretType name by checking if its value matches the expectations
    query('secretType').optional().custom((value: string) => {
      if (value !== 'registry' && value !== 'generic') {
        throw new Error('NOTVALID');
      }
      return true;
    }),

    //
    // validate the confMapId by checking if its name matches the expectations
    param('confMapId').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.confMap.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validate the buildId by checking if its name matches the expectations
    param('buildId').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.build.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validate the buildRunId by checking if its name matches the expectations
    param('buildRunId').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.buildRun.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validate the registry server (e.g. us.icr.io)
    param('registryServer').optional().isFQDN(),

    //
    // validate the registryId (which must point to secret name)
    param('registryId').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.secret.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validate the namespaceId, which points to a container registry namespace
    param('namespaceId').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.registry.namespace);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validate the repositoryId, which points to a container registry repository
    param('repositoryId').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.registry.repository);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),
  ];
};

export const getProjectCreationValidationRules = () => {

  // add specific rules for the request body to the ruleset that is going to be applied for URL parameters
  return getUrlValidationRules().concat([

    //
    // validate the region by checking the current configuration
    body('region').custom((value: string) => {
      return coligoUtils.isMultitenantRegion(value) || value === 'all';
    }),

    //
    // validate the kind by checking if it valid
    body('kind').equals(commonModel.UIEntityKinds.PROJECT),

    //
    // validate the resourceGroupId by checking if it is a valid UUID
    body('resourceGroupId').isString().isLength({ min: 32, max: 32 }),

    //
    // validate the project name by checking if its name matches the expectations (length, regexp, ...)
    body('name').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.project.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    // TODO tags (optional)
  ]);
};

export const getApplicationCreationValidationRules = () => {

  // add specific rules for the request body to the ruleset that is going to be applied for URL parameters
  return getUrlValidationRules().concat([

    //
    // validate the kind by checking if it valid
    body('kind').equals(commonModel.UIEntityKinds.APPLICATION),

    //
    // validate the app name by checking if its name matches the expectations (length, regexp, ...)
    body('name').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.application.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('template.cpus').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = floatValidator.isValid(value, coligoValidatorConfig.default.application.cpu);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('template.image').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.application.image);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('template.imagePullSecret').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.secret.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('template.maxScale').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = numberValidator.isValid(value, coligoValidatorConfig.default.application.maxScale);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('template.memory').custom((value: string) => {
      if (!commonValidator.isANumber(value)) {
        throw new Error('NAN');
      }
      const memoryInMib = memoryUtils.convertBytesToUnit(parseInt(value, 10), 'mi');
      const result: commonValidator.IClgValidationResult = memoryValidator.isValid(memoryInMib, coligoValidatorConfig.default.application.memory);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('template.minScale').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = numberValidator.isValid(value, coligoValidatorConfig.default.application.minScale);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('template.timeoutSeconds').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = numberValidator.isValid(value, coligoValidatorConfig.default.application.timeout);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('template.containerConcurrency').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = numberValidator.isValid(value, coligoValidatorConfig.default.application.containerConcurrency);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    // env variable name
    body('template.parameters.*.name').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.common.envVarName);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    // env variable value
    body('template.parameters.*.value').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.common.envVarValue);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),
  ]);
};

export const getAppInvokeValidationRules = () => {

  // add specific rules for the request body to the ruleset that is going to be applied for URL parameters
  return getUrlValidationRules().concat([
    body('url').isString().isURL(),
    body('verb').optional().isString().isLength({max: 50}),
    body('headers').optional().isEmpty(),
    body('payload').optional().isEmpty(),
  ]);
};

export const getClientLogsValidationRules = () => {

  // add specific rules for the request body
  return [
    body('logs.*.level').isString().isAlphanumeric().isLength({max: 20}),
    body('logs.*.message').isString(),
    body('logs.*.logger').isString().isLength({max: 50}),
    body('logs.*.timestamp').isString().isISO8601(),
    body('logs.*.stacktrace').optional().isString(),
  ];
};

export const getApplicationRevisionCreationValidationRules = () => {

  // add specific rules for the request body to the ruleset that is going to be applied for URL parameters
  return getUrlValidationRules().concat([

    //
    // validate the app revision name by checking if its name matches the expectations (length, regexp, ...)
    body('name').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.application.revisionName);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('cpus').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = floatValidator.isValid(value, coligoValidatorConfig.default.application.cpu);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('image').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.application.image);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('imagePullSecret').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.secret.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('maxScale').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = numberValidator.isValid(value, coligoValidatorConfig.default.application.maxScale);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('memory').optional().custom((value: string) => {
      if (!commonValidator.isANumber(value)) {
        throw new Error('NAN');
      }
      const memoryInMib = memoryUtils.convertBytesToUnit(parseInt(value, 10), 'mi');
      const result: commonValidator.IClgValidationResult = memoryValidator.isValid(memoryInMib, coligoValidatorConfig.default.application.memory);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('minScale').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = numberValidator.isValid(value, coligoValidatorConfig.default.application.minScale);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('timeoutSeconds').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = numberValidator.isValid(value, coligoValidatorConfig.default.application.timeout);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('containerConcurrency').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = numberValidator.isValid(value, coligoValidatorConfig.default.application.containerConcurrency);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    // env variable name
    body('parameters.*.name').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.common.envVarName);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    // env variable value
    body('parameters.*.value').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.common.envVarValue);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),
  ]);
};

export const getJobDefCreationValidationRules = () => {

  // add specific rules for the request body to the ruleset that is going to be applied for URL parameters
  return getUrlValidationRules().concat([

    //
    // validate the kind by checking if it valid
    body('kind').equals(commonModel.UIEntityKinds.JOBDEFINITION),

    //
    // validate the jobdef name by checking if its name matches the expectations (length, regexp, ...)
    body('name').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.job.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('spec.cpus').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = floatValidator.isValid(value, coligoValidatorConfig.default.job.cpu);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('spec.image').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.job.image);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('spec.imagePullSecret').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.secret.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('spec.memory').custom((value: string) => {
      if (!commonValidator.isANumber(value)) {
        throw new Error('NAN');
      }
      const memoryInMib = memoryUtils.convertBytesToUnit(parseInt(value, 10), 'mi');
      const result: commonValidator.IClgValidationResult = memoryValidator.isValid(memoryInMib, coligoValidatorConfig.default.job.memory);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    // env variable name
    body('spec.env.*.name').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.common.envVarName);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    // env variable value
    body('spec.env.*.value').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.common.envVarValue);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),
  ]);
};

export const getJobDefUpdateValidationRules = () => {

  // add specific rules for the request body to the ruleset that is going to be applied for URL parameters
  return getJobDefCreationValidationRules();
};

export const getJobRunCreationValidationRules = () => {

  // add specific rules for the request body to the ruleset that is going to be applied for URL parameters
  return getUrlValidationRules().concat([

    //
    // validate the kind by checking if it valid
    body('kind').equals(commonModel.UIEntityKinds.JOBRUN),

    //
    // validate the jobdef name by checking if its name matches the expectations (length, regexp, ...)
    body('definitionName').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.job.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('arraySize').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = numberValidator.isValid(value, coligoValidatorConfig.default.job.arraySize);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('arraySpec').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.job.arraySpec);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('maxExecutionTime').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = numberValidator.isValid(value, coligoValidatorConfig.default.job.maxExecutionTime);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('retryLimit').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = numberValidator.isValid(value, coligoValidatorConfig.default.job.retryLimit);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('spec.cpus').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = floatValidator.isValid(value, coligoValidatorConfig.default.job.cpu);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('spec.image').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.job.image);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('spec.imagePullSecret').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.secret.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    body('spec.memory').custom((value: string) => {
      if (!commonValidator.isANumber(value)) {
        throw new Error('NAN');
      }
      const memoryInMib = memoryUtils.convertBytesToUnit(parseInt(value, 10), 'mi');
      const result: commonValidator.IClgValidationResult = memoryValidator.isValid(memoryInMib, coligoValidatorConfig.default.job.memory);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),
  ]);
};

export const getSecretCreationValidationRules = () => {

  // add specific rules for the request body to the ruleset that is going to be applied for URL parameters
  return getUrlValidationRules().concat([

    //
    // validate the kind by checking if its valid
    body('kind').equals(commonModel.UIEntityKinds.SECRET),

    //
    // validate the secret name by checking if its name matches the expectations (length, regexp, ...)
    body('name').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.secret.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validation rules for registry server
    body('server').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.registry.server);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validation rules for username
    body('username').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.registry.username);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validation rules for password
    body('password').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.registry.password);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validation rules for email
    body('email').optional().isEmail().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.registry.email);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // data keys
    body('data.*.key').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.common.keyvalueKey);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    // data value
    body('data.*.value').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.common.keyvalueValue);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),
  ]);
};

export const getConfMapCreationValidationRules = () => {

  // add specific rules for the request body to the ruleset that is going to be applied for URL parameters
  return getUrlValidationRules().concat([

    //
    // validate the kind by checking if its valid
    body('kind').equals(commonModel.UIEntityKinds.CONFMAP),

    //
    // validate the confMap name by checking if its name matches the expectations (length, regexp, ...)
    body('name').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.confMap.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // data keys
    body('data.*.key').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.common.keyvalueKey);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    // data value
    body('data.*.value').optional().custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.common.keyvalueValue);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),
  ]);
};

export const getBuildCreationValidationRules = () => {

  // add specific rules for the request body to the ruleset that is going to be applied for URL parameters
  return getUrlValidationRules().concat([

    //
    // validate the kind by checking if its valid
    body('kind').equals(commonModel.UIEntityKinds.BUILD),

    //
    // validate the build name by checking if its name matches the expectations (length, regexp, ...)
    body('name').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.build.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validate the outputImage
    body('outputCredentials').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.secret.name);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validate the outputImage
    body('outputImage').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.build.outputImage);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validate the sourceUrl
    body('sourceUrl').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.build.sourceUrl);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validate the sourceRev
    body('sourceRev').optional().custom((value: string) => {
        const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.build.sourceRev);
        if (!result.valid) {
          throw new Error(result.reason);
        }
        return true;
      }),

    //
    // validate the strategyKind
    body('strategyKind').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.build.strategyKind);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // validate the strategyName
    body('strategyName').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.build.strategyName);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // TODO add validation for all the other properties, too
  ]);
};

export const getBuildRunCreationValidationRules = () => {

  // add specific rules for the request body to the ruleset that is going to be applied for URL parameters
  return getUrlValidationRules().concat([

    //
    // validate the kind by checking if its valid
    body('kind').equals(commonModel.UIEntityKinds.BUILDRUN),

    //
    // validate the buildRef by checking if its name matches the expectations (length, regexp, ...)
    body('buildRef').custom((value: string) => {
      const result: commonValidator.IClgValidationResult = textValidator.isValid(value, coligoValidatorConfig.default.buildRun.buildRef);
      if (!result.valid) {
        throw new Error(result.reason);
      }
      return true;
    }),

    //
    // TODO add validation for all the other properties, too
  ]);
};

export const getBuildUpdateValidationRules = () => {

  // add specific rules for the request body to the ruleset that is going to be applied for URL parameters
  return getBuildCreationValidationRules();
};

/**
 * This function validates whether there are any validation errors stored in the request.
 * In case of validation errors, it stops the request from being further processed and sends a error response to the client
 * @param req the HTTP request
 * @param res the HTTP response
 * @param next the handler method that should be called to move to the next middleware function
 */
export function validate(req, res, next) {
  const ctx: commonModel.IUIRequestContext = getClgContext(req);
  const monitor: monitoringModel.IPerformanceMonitor = getClgMonitor(req);
  const routeId: string = getClgRoute(req);

  const validationErrors = validationResult(req);
  if (validationErrors.isEmpty()) {
    return next();
  }

  // log the validation errors
  logger.debug(ctx, `${routeId} validation errors:  ${JSON.stringify(validationErrors)}`);

  // create a custom error
  let error;

  // we may wanna give feedback to the user what exactly went wrong,
  // to keep things easy as possible, we only transfer one validation error at a time
  const validationError = validationErrors.array({ onlyFirstError: true })[0];
  if (validationError.location === 'body') {
    error = new errors.BadInputPayloadError(validationError.param, validationError.msg);
  } else {
    error = new errors.BadInputError(validationError.param, validationError.msg);
  }

  const result: commonModel.IUIRequestError = middlewareUtils.createUIRequestError(ctx, monitor, 400, error);
  logger.debug(ctx, `${routeId} returning ${result.statusCode} - duration: ${result.duration}ms`);
  res.status(result.statusCode).send(result);
}
