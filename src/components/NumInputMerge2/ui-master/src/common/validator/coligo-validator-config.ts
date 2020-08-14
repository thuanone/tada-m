import * as memoryUtils from './../utils/memory-utils';

export default {
  // see: https://github.ibm.com/coligo/serving/blob/master/coligo-project-user-guide.md#resource-quotas-and-limit-ranges
  application: {
    containerConcurrency: {
      default: 10,
      max: 1000,
      min: 0,
    },
    cpu: {
      default: 0.1,
      max: 8,
      min: 0.01,
    },
    image: {
      emptyAllowed: false,
      regexp: '[\\S]*', // no whitespaces
    },
    maxScale: {
      default: 10,
      max: 250,
      min: 0,
    },
    memory: {
      default: memoryUtils.convertValueToBytes('1Gi'),
      max: memoryUtils.convertValueToBytes('32Gi'),
      min: memoryUtils.convertValueToBytes('128Mi'),
    },
    minScale: {
      default: 0,
      max: 250,
      min: 0,
    },
    name: {
      emptyAllowed: false,
      maxLength: 63,
      minLength: 1,
      regexp: '[a-z0-9]+(?:-[a-z0-9]+)*',
      source: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-label-names',
    },
    revisionName: {
      emptyAllowed: false,
      maxLength: 63,
      minLength: 1,
      regexp: '[a-z0-9]+(?:-[a-z0-9]+)*',
      source: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-label-names',
    },
    timeout: {
      default: 300,
      max: 600,
      min: 0,
    },
  },
  // see: https://github.ibm.com/coligo/serving/blob/master/coligo-project-user-guide.md#resource-quotas-and-limit-ranges
  build: {
    name: {
      emptyAllowed: false,
      maxLength: 50, // we need to reserve some characters for the buildruns
      minLength: 1,
      regexp: '[a-z0-9]+(?:-[a-z0-9]+)*',
      source: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-label-names',
    },
    outputImage: {
      emptyAllowed: false,
      maxLength: 253,
      minLength: 1,
      regexp: '[\\S]*', // no whitespaces
    },
    sourceUrl: {
      emptyAllowed: false,
      maxLength: 253,
      minLength: 1,
      regexp: '[\\S]*', // no whitespaces
    },
    sourceRev: {
      emptyAllowed: true,
      maxLength: 253,
      minLength: 1,
      regexp: '[\\S]*', // no whitespaces
    },
    strategyKind: {
      emptyAllowed: false,
      maxLength: 253,
      minLength: 1,
      regexp: '[\\S]*', // no whitespaces
    },
    strategyName: {
      emptyAllowed: false,
      default: 'kaniko-medium',
      maxLength: 253,
      minLength: 1,
      regexp: '[\\S]*', // no whitespaces
    },
  },
  buildRun: {
    buildRef: {
      emptyAllowed: false,
      maxLength: 63,
      minLength: 1,
      regexp: '[a-z0-9]+(?:-[a-z0-9]+)*',
      source: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-label-names',
    },
    name: {
      emptyAllowed: false,
      maxLength: 63,
      minLength: 1,
      regexp: '[a-z0-9]+(?:-[a-z0-9]+)*',
      source: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-label-names',
    },
  },
  common: {
    envVarName: {
      emptyAllowed: false,
      maxLength: 253,
      minLength: 1,
      regexp: '[-._a-zA-Z][-._a-zA-Z0-9]*',
      source: 'https://gitlab.cncf.ci/kubernetes/kubernetes/blob/master/staging/src/k8s.io/apimachinery/pkg/util/validation/validation.go#L402-416'
    },
    envVarValue: {
      emptyAllowed: true,
      maxLength: 1048576,
      minLength: 0,
      source: 'https://stackoverflow.com/questions/53842574/max-size-of-environment-variables-in-kubernetes'
    },
    image: {
      emptyAllowed: false,
      regexp: '[\\S]*', // no whitespaces
    },
    imageNamespace: {
      emptyAllowed: false,
      regexp: '[\\S]*', // no whitespaces
    },
    imageRepository: {
      emptyAllowed: false,
      regexp: '[\\S]*', // no whitespaces
    },
    imageTag: {
      emptyAllowed: false,
      regexp: '[\\S]*', // no whitespaces
    },
    keyvalueKey: {
      emptyAllowed: false,
      maxLength: 253,
      minLength: 1,
      regexp: '[-._a-zA-Z][-._a-zA-Z0-9]*',
      source: 'https://gitlab.cncf.ci/kubernetes/kubernetes/blob/master/staging/src/k8s.io/apimachinery/pkg/util/validation/validation.go#L424-434'
    },
    keyvalueValue: {
      emptyAllowed: true,
      maxLength: 1048576,
      minLength: 0,
      source: 'https://stackoverflow.com/questions/53842574/max-size-of-environment-variables-in-kubernetes'
    }
  },
  confMap: {
    name: {
      emptyAllowed: false,
      maxLength: 253,
      minLength: 1,
      regexp: '[a-z0-9]+(?:-[a-z0-9]+)*',
      source: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-subdomain-names',
    },
  },
  job: {
    arraySize: {
      default: 1,
      max: 1000,
      min: 1,
      source: 'https://github.ibm.com/coligo/batch-job-controller/blob/0ddf2e9aef6b271c770c4392c2a916e7ada2c63a/deployment/crds/codeengine.cloud.ibm.com_jobrun.yaml#L42-L45',
    },
    arraySpec: {
      default: '0',
      maxLength: 253,
      minLength: 1,
      regexp: '^(?:[1-9]\\d\\d|[1-9]?\\d)(?:-(?:[1-9]\\d\\d|[1-9]?\\d))?(?:,(?:[1-9]\\d\\d|[1-9]?\\d)(?:-(?:[1-9]\\d\\d|[1-9]?\\d))?)*$',
      source: 'TODO',
    },
    cpu: {
      default: 1,
      max: 8,
      min: 1,
    },
    image: {
      emptyAllowed: false,
    },
    maxExecutionTime: {
      default: 7200,  // 2 hours
      max: 7200,  // 2 hours
      min: 1,
      source: 'https://github.ibm.com/coligo/batch-job-controller/blob/0ddf2e9aef6b271c770c4392c2a916e7ada2c63a/deployment/crds/codeengine.cloud.ibm.com_jobrun.yaml#L50-L54'
    },
    memory: {
      default: memoryUtils.convertValueToBytes('128Mi'),
      max: memoryUtils.convertValueToBytes('32Gi'),
      min: memoryUtils.convertValueToBytes('128Mi'),
    },
    name: {
      emptyAllowed: false,
      maxLength: 63,
      minLength: 1,
      regexp: '[a-z0-9]+(?:-[a-z0-9]+)*',
      source: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-label-names',
    },
    retryLimit: {
      default: 3,
      max: 5,
      min: 0,
      source: 'https://github.ibm.com/coligo/batch-job-controller/blob/0ddf2e9aef6b271c770c4392c2a916e7ada2c63a/deployment/crds/codeengine.cloud.ibm.com_jobrun.yaml#L46-L49'
    },
  },
  project: {
    name: {
      emptyAllowed: false,
      maxLength: 180,
      minLength: 1,
      regexp: '^([^\x00-\x7F]|[a-zA-Z0-9-._: ])+$',
    },
    tagsInHeader: {
      maxCharacters: 0,
      maxCharactersTooltip: 30,
      maxTagsTooltip: 8,
      numTagsDisplayed: 4,
      source: 'https://pages.github.ibm.com/ibmcloud/pal/components/tag-list/code',
    },
    tagsInTable: {
      maxCharacters: 10,
      maxCharactersTooltip: 30,
      maxTagsTooltip: 8,
      numTagsDisplayed: 2,
      source: 'https://pages.github.ibm.com/ibmcloud/pal/components/tag-list/code',
    }
  },
  registry: {
    email: {
      emptyAllowed: false,
      regexp: '[\\S]*', // no whitespaces
    },
    name: {
      emptyAllowed: false,
      maxLength: 253,
      minLength: 1,
      regexp: '[a-z0-9]+(?:-[a-z0-9]+)*',
      source: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-subdomain-names',
    },
    namespace: {
      emptyAllowed: false,
      maxLength: 30,
      minLength: 4,
      regexp: '[a-z0-9]+(?:[-_][a-z0-9]+)*',
      source: 'https://cloud.ibm.com/kubernetes/registry/main/namespaces',
    },
    repository: {
      emptyAllowed: false,
      maxLength: 30,
      minLength: 1,
      regexp: '[a-z0-9]+(?:[-_][a-z0-9]+)*',
      source: 'TODO',
    },
    password: { // pragma: allowlist secret
      emptyAllowed: false,
      maxLength: 253,
      minLength: 1,
    },
    server: {
      emptyAllowed: false,
      maxLength: 253,
      minLength: 1,
      regexp: '[\\S]*', // no whitespaces
    },
    username: {
      emptyAllowed: false,
      maxLength: 253,
      minLength: 1,
    },
  },
  secret: {
    name: {
      emptyAllowed: false,
      maxLength: 253,
      minLength: 1,
      regexp: '[a-z0-9]+(?:-[a-z0-9]+)*',
      source: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-subdomain-names',
    },
  },
};
