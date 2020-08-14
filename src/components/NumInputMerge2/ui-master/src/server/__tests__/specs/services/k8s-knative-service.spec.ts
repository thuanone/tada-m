import * as fs from 'fs';

// regular imports
import * as commonModel from '../../../../common/model/common-model';
import * as commonErrors from './../../../../common/Errors';
import * as knativeModel from './../../../ts/model/knative-model';

// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as loggerUtilMock from '../../mocks/lib/console-platform-log4js-utils';

const resiliencyMock = {
  request: (options, callbackFn) => {
    const error = undefined;
    let response;
    let body;

    // getKnServingResourceList
    if (options.method === 'GET' && options.path.indexOf('/namespaces/namespace-for-getlist') > -1) {
      if (options.headers.Authorization.indexOf('something-stupid') > -1) {
        response = {
          statusCode: 400
        };
        body = '';
      } else if (options.headers.Authorization.indexOf('something-broken') > -1) {
        response = {
          statusCode: 200
        };
        body = 'this is a string not a JSON object';
      } else {
        response = {
          statusCode: 200
        };
        if (options.path.indexOf('/revisions') > -1) {
          body = '{"apiVersion":"serving.knative.dev/v1alpha1","items":[{"apiVersion":"serving.knative.dev/v1alpha1","kind":"Revision","metadata":{"annotations":{"serving.knative.dev/lastPinned":"1565384474"},"creationTimestamp":"2019-08-03T00:30:28Z","generateName":"a-sample-is-a-sample-","generation":1,"labels":{"serving.knative.dev/configuration":"a-sample-is-a-sample","serving.knative.dev/configurationGeneration":"1","serving.knative.dev/service":"a-sample-is-a-sample"},"name":"a-sample-is-a-sample-fzjpl","namespace":"namespace2","ownerReferences":[{"apiVersion":"serving.knative.dev/v1alpha1","blockOwnerDeletion":true,"controller":true,"kind":"Configuration","name":"a-sample-is-a-sample","uid":"e4a5b6b8-b585-11e9-a788-6aa35994fc4d"}],"resourceVersion":"5700097","selfLink":"/apis/serving.knative.dev/v1alpha1/namespaces/namespace2/revisions/a-sample-is-a-sample-fzjpl","uid":"e4af247f-b585-11e9-a788-6aa35994fc4d"},"spec":{"containers":[{"image":"docker.io/reggeenr/helloworld-nodejs","name":"","resources":{}}],"timeoutSeconds":300},"status":{"conditions":[{"lastTransitionTime":"2019-08-05T09:24:29Z","message":"The target is not receiving traffic.","reason":"NoTraffic","severity":"Info","status":"False","type":"Active"},{"lastTransitionTime":"2019-08-03T00:30:28Z","status":"True","type":"BuildSucceeded"},{"lastTransitionTime":"2019-08-03T00:30:31Z","status":"True","type":"ContainerHealthy"},{"lastTransitionTime":"2019-08-03T00:30:31Z","status":"True","type":"Ready"},{"lastTransitionTime":"2019-08-03T00:30:31Z","status":"True","type":"ResourcesAvailable"}],"imageDigest":"index.docker.io/reggeenr/helloworld-nodejs@sha256:a1da7bc886a23eaf35aa505434de6a9fe8681bb3612a9a303526581d041b1d1d","logUrl":"","observedGeneration":1,"serviceName":"a-sample-is-a-sample-fzjpl"}}],"kind":"RevisionList","metadata":{"continue":"","resourceVersion":"5700336","selfLink":"/apis/serving.knative.dev/v1alpha1/namespaces/namespace2/revisions"}}';
        } else if (options.path.indexOf('/services') > -1) {
          body = '{"apiVersion":"serving.knative.dev/v1alpha1","items":[{"apiVersion":"serving.knative.dev/v1alpha1","kind":"Service","metadata":{"annotations":{"serving.knative.dev/creator":"IAM#foot@bar.com","serving.knative.dev/lastModifier":"IAM#foot@bar.com"},"creationTimestamp":"2019-08-03T00:30:28Z","generation":1,"name":"a-sample-is-a-sample","namespace":"namespace2","resourceVersion":"4585236","selfLink":"/apis/serving.knative.dev/v1alpha1/namespaces/namespace2/services/a-sample-is-a-sample","uid":"e4a017a1-b585-11e9-a788-6aa35994fc4d"},"spec":{"template":{"metadata":{"creationTimestamp":null},"spec":{"containers":[{"image":"docker.io/reggeenr/helloworld-nodejs","name":"","resources":{}}],"timeoutSeconds":300}},"traffic":[{"latestRevision":true,"percent":100}]},"status":{"address":{"hostname":"a-sample-is-a-sample.namespace2.svc.cluster.local","url":"https://a-sample-is-a-sample.namespace2.svc.cluster.local"},"conditions":[{"lastTransitionTime":"2019-08-03T00:30:31Z","status":"True","type":"ConfigurationsReady"},{"lastTransitionTime":"2019-08-03T00:30:32Z","status":"True","type":"Ready"},{"lastTransitionTime":"2019-08-03T00:30:32Z","status":"True","type":"RoutesReady"}],"domain":"a-sample-is-a-sample-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud","domainInternal":"a-sample-is-a-sample.namespace2.svc.cluster.local","latestCreatedRevisionName":"a-sample-is-a-sample-fzjpl","latestReadyRevisionName":"a-sample-is-a-sample-fzjpl","observedGeneration":1,"traffic":[{"latestRevision":true,"percent":100,"revisionName":"a-sample-is-a-sample-fzjpl"}],"url":"https://a-sample-is-a-sample-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud"}},{"apiVersion":"serving.knative.dev/v1alpha1","kind":"Service","metadata":{"annotations":{"serving.knative.dev/creator":"IAM#foot@bar.com","serving.knative.dev/lastModifier":"IAM#foot@bar.com"},"creationTimestamp":"2019-07-26T15:15:58Z","generation":1,"name":"chit-chat","namespace":"namespace2","resourceVersion":"3399591","selfLink":"/apis/serving.knative.dev/v1alpha1/namespaces/namespace2/services/chit-chat","uid":"4535f394-afb8-11e9-b5ed-c2864bb13fc7"},"spec":{"template":{"metadata":{"creationTimestamp":null},"spec":{"containers":[{"image":"docker.io/reggeenr/helloworld-nodejs","name":"","resources":{}}],"timeoutSeconds":300}},"traffic":[{"latestRevision":true,"percent":100}]},"status":{"address":{"hostname":"chit-chat.namespace2.svc.cluster.local","url":"https://chit-chat.namespace2.svc.cluster.local"},"conditions":[{"lastTransitionTime":"2019-07-26T15:16:01Z","status":"True","type":"ConfigurationsReady"},{"lastTransitionTime":"2019-07-26T15:16:02Z","status":"True","type":"Ready"},{"lastTransitionTime":"2019-07-26T15:16:02Z","status":"True","type":"RoutesReady"}],"domain":"chit-chat-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud","domainInternal":"chit-chat.namespace2.svc.cluster.local","latestCreatedRevisionName":"chit-chat-79424","latestReadyRevisionName":"chit-chat-79424","observedGeneration":1,"traffic":[{"latestRevision":true,"percent":100,"revisionName":"chit-chat-79424"}],"url":"https://chit-chat-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud"}},{"apiVersion":"serving.knative.dev/v1alpha1","kind":"Service","metadata":{"annotations":{"serving.knative.dev/creator":"IAM#foot@bar.com","serving.knative.dev/lastModifier":"IAM#foot@bar.com"},"creationTimestamp":"2019-08-05T09:20:34Z","generation":2,"name":"my-monday--app","namespace":"namespace2","resourceVersion":"4971815","selfLink":"/apis/serving.knative.dev/v1alpha1/namespaces/namespace2/services/my-monday--app","uid":"479ecc9a-b762-11e9-9314-f277bcf92ebc"},"spec":{"template":{"metadata":{"annotations":{"autoscaling.knative.dev/maxScale":"1","autoscaling.knative.dev/minScale":"0","serving.knative.dev/lastPinned":"1564996838"},"creationTimestamp":null,"name":"my-monday--app-00002"},"spec":{"containers":[{"image":"docker.io/reggeenr/helloworld-nodejs","name":"","resources":{"limits":{"cpu":"1","memory":"128Mi"}}}],"timeoutSeconds":300}},"traffic":[{"latestRevision":true,"percent":100}]},"status":{"address":{"hostname":"my-monday--app.namespace2.svc.cluster.local","url":"https://my-monday--app.namespace2.svc.cluster.local"},"conditions":[{"lastTransitionTime":"2019-08-05T09:21:40Z","status":"True","type":"ConfigurationsReady"},{"lastTransitionTime":"2019-08-05T09:21:40Z","status":"True","type":"Ready"},{"lastTransitionTime":"2019-08-05T09:21:40Z","status":"True","type":"RoutesReady"}],"domain":"my-monday--app-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud","domainInternal":"my-monday--app.namespace2.svc.cluster.local","latestCreatedRevisionName":"my-monday--app-00002","latestReadyRevisionName":"my-monday--app-00002","observedGeneration":2,"traffic":[{"latestRevision":true,"percent":100,"revisionName":"my-monday--app-00002"}],"url":"https://my-monday--app-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud"}},{"apiVersion":"serving.knative.dev/v1alpha1","kind":"Service","metadata":{"annotations":{"serving.knative.dev/creator":"IAM#foot@bar.com","serving.knative.dev/lastModifier":"IAM#foot@bar.com"},"creationTimestamp":"2019-08-01T12:24:20Z","generation":3,"name":"some-cool-name","namespace":"namespace2","resourceVersion":"4957632","selfLink":"/apis/serving.knative.dev/v1alpha1/namespaces/namespace2/services/some-cool-name","uid":"4a096317-b457-11e9-a788-6aa35994fc4d"},"spec":{"template":{"metadata":{"annotations":{"autoscaling.knative.dev/maxScale":"2","autoscaling.knative.dev/minScale":"0","serving.knative.dev/lastPinned":"1564984369"},"creationTimestamp":null,"name":"some-cool-name-00003"},"spec":{"containerConcurrency":2,"containers":[{"image":"docker.io/reggeenr/helloworld-nodejs","name":"","resources":{"limits":{"cpu":"1","memory":"128Mi"}}}],"timeoutSeconds":220}},"traffic":[{"latestRevision":true,"percent":100}]},"status":{"address":{"hostname":"some-cool-name.namespace2.svc.cluster.local","url":"https://some-cool-name.namespace2.svc.cluster.local"},"conditions":[{"lastTransitionTime":"2019-08-05T07:22:59Z","status":"True","type":"ConfigurationsReady"},{"lastTransitionTime":"2019-08-05T07:22:59Z","status":"True","type":"Ready"},{"lastTransitionTime":"2019-08-05T07:22:59Z","status":"True","type":"RoutesReady"}],"domain":"some-cool-name-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud","domainInternal":"some-cool-name.namespace2.svc.cluster.local","latestCreatedRevisionName":"some-cool-name-00003","latestReadyRevisionName":"some-cool-name-00003","observedGeneration":3,"traffic":[{"latestRevision":true,"percent":100,"revisionName":"some-cool-name-00003"}],"url":"https://some-cool-name-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud"}}],"kind":"ServiceList","metadata":{"continue":"","resourceVersion":"5696223","selfLink":"/apis/serving.knative.dev/v1alpha1/namespaces/namespace2/services"}}';
        }
      }
    }

    // getKnServingResource
    if (options.method === 'GET' && options.path.indexOf('/namespaces/namespace-for-getobject') > -1) {
      if (options.headers.Authorization.indexOf('something-stupid') > -1) {
        response = {
          statusCode: 400
        };
        body = '';
      } else if (options.headers.Authorization.indexOf('something-broken') > -1) {
        response = {
          statusCode: 200
        };
        body = 'this is a string not a JSON object';
      } else {
        response = {
          statusCode: 200
        };
        if (options.path.indexOf('/routes/') > -1) {
          body = '{"apiVersion":"serving.knative.dev/v1alpha1","kind":"Route","metadata":{"annotations":{"serving.knative.dev/creator":"IAM#foot@bar.com","serving.knative.dev/lastModifier":"IAM#foot@bar.com"},"creationTimestamp":"2019-08-03T00:30:28Z","finalizers":["routes.serving.knative.dev"],"generation":1,"labels":{"serving.knative.dev/service":"a-sample-is-a-sample"},"name":"a-sample-is-a-sample","namespace":"namespace2","ownerReferences":[{"apiVersion":"serving.knative.dev/v1alpha1","blockOwnerDeletion":true,"controller":true,"kind":"Service","name":"a-sample-is-a-sample","uid":"e4a017a1-b585-11e9-a788-6aa35994fc4d"}],"resourceVersion":"4585235","selfLink":"/apis/serving.knative.dev/v1alpha1/namespaces/namespace2/routes/a-sample-is-a-sample","uid":"e4af1967-b585-11e9-a788-6aa35994fc4d"},"spec":{"traffic":[{"configurationName":"a-sample-is-a-sample","latestRevision":true,"percent":100}]},"status":{"address":{"hostname":"a-sample-is-a-sample.namespace2.svc.cluster.local","url":"https://a-sample-is-a-sample.namespace2.svc.cluster.local"},"conditions":[{"lastTransitionTime":"2019-08-03T00:30:31Z","status":"True","type":"AllTrafficAssigned"},{"lastTransitionTime":"2019-08-03T00:30:32Z","status":"True","type":"IngressReady"},{"lastTransitionTime":"2019-08-03T00:30:32Z","status":"True","type":"Ready"}],"domain":"a-sample-is-a-sample-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud","domainInternal":"a-sample-is-a-sample.namespace2.svc.cluster.local","observedGeneration":1,"traffic":[{"latestRevision":true,"percent":100,"revisionName":"a-sample-is-a-sample-fzjpl"}],"url":"https://a-sample-is-a-sample-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud"}}';
        } else if (options.path.indexOf('/configurations/') > -1) {
          body = '{"apiVersion":"serving.knative.dev/v1alpha1","kind":"Configuration","metadata":{"creationTimestamp":"2019-08-03T00:30:28Z","generation":1,"labels":{"serving.knative.dev/route":"a-sample-is-a-sample","serving.knative.dev/service":"a-sample-is-a-sample"},"name":"a-sample-is-a-sample","namespace":"namespace2","ownerReferences":[{"apiVersion":"serving.knative.dev/v1alpha1","blockOwnerDeletion":true,"controller":true,"kind":"Service","name":"a-sample-is-a-sample","uid":"e4a017a1-b585-11e9-a788-6aa35994fc4d"}],"resourceVersion":"4585226","selfLink":"/apis/serving.knative.dev/v1alpha1/namespaces/namespace2/configurations/a-sample-is-a-sample","uid":"e4a5b6b8-b585-11e9-a788-6aa35994fc4d"},"spec":{"template":{"metadata":{"creationTimestamp":null},"spec":{"containers":[{"image":"docker.io/reggeenr/helloworld-nodejs","name":"","resources":{}}],"timeoutSeconds":300}}},"status":{"conditions":[{"lastTransitionTime":"2019-08-03T00:30:31Z","status":"True","type":"Ready"}],"latestCreatedRevisionName":"a-sample-is-a-sample-fzjpl","latestReadyRevisionName":"a-sample-is-a-sample-fzjpl","observedGeneration":1}}';
        } else if (options.path.indexOf('/services/') > -1) {
          body = '{"apiVersion":"serving.knative.dev/v1alpha1","kind":"Service","metadata":{"annotations":{"serving.knative.dev/creator":"IAM#foot@bar.com","serving.knative.dev/lastModifier":"IAM#foot@bar.com"},"creationTimestamp":"2019-08-03T00:30:28Z","generation":1,"name":"a-sample-is-a-sample","namespace":"namespace2","resourceVersion":"4585236","selfLink":"/apis/serving.knative.dev/v1alpha1/namespaces/namespace2/services/a-sample-is-a-sample","uid":"e4a017a1-b585-11e9-a788-6aa35994fc4d"},"spec":{"template":{"metadata":{"creationTimestamp":null},"spec":{"containers":[{"image":"docker.io/reggeenr/helloworld-nodejs","name":"","resources":{}}],"timeoutSeconds":300}},"traffic":[{"latestRevision":true,"percent":100}]},"status":{"address":{"hostname":"a-sample-is-a-sample.namespace2.svc.cluster.local","url":"https://a-sample-is-a-sample.namespace2.svc.cluster.local"},"conditions":[{"lastTransitionTime":"2019-08-03T00:30:31Z","status":"True","type":"ConfigurationsReady"},{"lastTransitionTime":"2019-08-03T00:30:32Z","status":"True","type":"Ready"},{"lastTransitionTime":"2019-08-03T00:30:32Z","status":"True","type":"RoutesReady"}],"domain":"a-sample-is-a-sample-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud","domainInternal":"a-sample-is-a-sample.namespace2.svc.cluster.local","latestCreatedRevisionName":"a-sample-is-a-sample-fzjpl","latestReadyRevisionName":"a-sample-is-a-sample-fzjpl","observedGeneration":1,"traffic":[{"latestRevision":true,"percent":100,"revisionName":"a-sample-is-a-sample-fzjpl"}],"url":"https://a-sample-is-a-sample-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud"}}';
        }
      }
    }

    // createKnService
    if (options.method === 'POST' && options.path.indexOf('/namespaces/namespace-for-creation/services') > -1) {
      if (options.headers.Authorization.indexOf('something-stupid') > -1) {
        response = {
          statusCode: 400
        };
        body = '';
      } else if (options.headers.Authorization.indexOf('something-broken') > -1) {
        response = {
          statusCode: 200
        };
        body = 'this is a string not a JSON object';
      } else if (options.headers.Authorization.indexOf('something-invalid') > -1) {
        response = {
          statusCode: 400
        };
        body = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-knative/create-service_response-error-badfield.json', 'utf8'));
      } else if (options.headers.Authorization.indexOf('something-exists') > -1) {
        response = {
          statusCode: 400
        };
        body = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-knative/create-service_response-error-alreadyexists.json', 'utf8'));
      } else {
        response = {
          statusCode: 200
        };
        body = { apiVersion: 'serving.knative.dev/v1alpha1', kind: 'Service', metadata: { annotations: { 'serving.knative.dev/creator': 'IAM#foot@bar.com', 'serving.knative.dev/lastModifier': 'IAM#foot@bar.com' }, creationTimestamp: '2019-08-03T00:30:28Z', generation: 1, name: 'a-sample-is-a-sample', namespace: 'namespace2', resourceVersion: '4585236', selfLink: '/apis/serving.knative.dev/v1alpha1/namespaces/namespace2/services/a-sample-is-a-sample', uid: 'e4a017a1-b585-11e9-a788-6aa35994fc4d' }, spec: { template: { metadata: { creationTimestamp: null }, spec: { containers: [{ image: 'docker.io/reggeenr/helloworld-nodejs', name: '', resources: {} }], timeoutSeconds: 300 } }, traffic: [{ latestRevision: true, percent: 100 }] }, status: { address: { hostname: 'a-sample-is-a-sample.namespace2.svc.cluster.local', url: 'https://a-sample-is-a-sample.namespace2.svc.cluster.local' }, conditions: [{ lastTransitionTime: '2019-08-03T00:30:31Z', status: 'True', type: 'ConfigurationsReady' }, { lastTransitionTime: '2019-08-03T00:30:32Z', status: 'True', type: 'Ready' }, { lastTransitionTime: '2019-08-03T00:30:32Z', status: 'True', type: 'RoutesReady' }], domain: 'a-sample-is-a-sample-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud', domainInternal: 'a-sample-is-a-sample.namespace2.svc.cluster.local', latestCreatedRevisionName: 'a-sample-is-a-sample-fzjpl', latestReadyRevisionName: 'a-sample-is-a-sample-fzjpl', observedGeneration: 1, traffic: [{ latestRevision: true, percent: 100, revisionName: 'a-sample-is-a-sample-fzjpl' }], url: 'https://a-sample-is-a-sample-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud' } };
      }
    }

    // deleteKnService
    if (options.method === 'DELETE' && options.path.indexOf('/namespaces/namespace-for-deletion/services') > -1) {
      if (options.headers.Authorization.indexOf('something-stupid') > -1) {
        response = {
          statusCode: 400
        };
        body = '';
      } else if (options.headers.Authorization.indexOf('something-broken') > -1) {
        response = {
          statusCode: 404
        };
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-knative/delete-service_response-failed.json', 'utf8');
      } else {
        response = {
          statusCode: 200
        };
        body = fs.readFileSync('src/server/__tests__/mocks/backends/k8s-knative/delete-service_response-ok.json', 'utf8');
      }
    }

    // createKnServiceRevision
    if (options.method === 'PUT' && options.path.indexOf('/namespaces/namespace-for-creation/services') > -1) {
      if (options.headers.Authorization.indexOf('something-stupid') > -1) {
        response = {
          statusCode: 400
        };
        body = '';
      } else if (options.headers.Authorization.indexOf('something-broken') > -1) {
        response = {
          statusCode: 200
        };
        body = 'this is a string not a JSON object';
      } else {
        response = {
          statusCode: 200
        };
        body = { apiVersion: 'serving.knative.dev/v1alpha1', kind: 'Service', metadata: { annotations: { 'serving.knative.dev/creator': 'IAM#foot@bar.com', 'serving.knative.dev/lastModifier': 'IAM#foot@bar.com' }, creationTimestamp: '2019-08-03T00:30:28Z', generation: 2, name: 'a-sample-is-a-sample', namespace: 'namespace2', resourceVersion: '5704271', selfLink: '/apis/serving.knative.dev/v1alpha1/namespaces/namespace2/services/a-sample-is-a-sample', uid: 'e4a017a1-b585-11e9-a788-6aa35994fc4d' }, spec: { template: { metadata: { creationTimestamp: null, name: 'a-sample-is-a-sample-00002' }, spec: { containers: [{ env: [{ name: 'some', value: 'value' }], image: 'docker.io/reggeenr/helloworld-nodejs', name: '', resources: {} }], timeoutSeconds: 300 } }, traffic: [{ latestRevision: true, percent: 100 }] }, status: { address: { hostname: 'a-sample-is-a-sample.namespace2.svc.cluster.local', url: 'https://a-sample-is-a-sample.namespace2.svc.cluster.local' }, conditions: [{ lastTransitionTime: '2019-08-03T00:30:31Z', status: 'True', type: 'ConfigurationsReady' }, { lastTransitionTime: '2019-08-03T00:30:32Z', status: 'True', type: 'Ready' }, { lastTransitionTime: '2019-08-03T00:30:32Z', status: 'True', type: 'RoutesReady' }], domain: 'a-sample-is-a-sample-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud', domainInternal: 'a-sample-is-a-sample.namespace2.svc.cluster.local', latestCreatedRevisionName: 'a-sample-is-a-sample-fzjpl', latestReadyRevisionName: 'a-sample-is-a-sample-fzjpl', observedGeneration: 1, traffic: [{ latestRevision: true, percent: 100, revisionName: 'a-sample-is-a-sample-fzjpl' }], url: 'https://a-sample-is-a-sample-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud' } };
      }
    }

    callbackFn(error, response, body);
  }
};

const monitoringUtilsMock = {
  createPerfLogEntry: (...args) => {
    // relax and take it easy
  },
  storePerfMonitorEntry: (...args) => {
    // relax and take it easy
  }
};

function getRequestContextMock(): commonModel.IUIRequestContext {
  return {
    startTime: Date.now(),
    tid: 'foo',
    user: {}
  } as commonModel.IUIRequestContext;
}

describe('getKnServicesOfNamespace()', () => {
  let k8sKnativeService;

  beforeEach(() => {
    k8sKnativeService = proxyquire('../../../ts/services/k8s-knative-service', {
      '../utils/logger-utils': loggerUtilMock,
      '../utils/monitoring-utils': monitoringUtilsMock,
      '@console/console-platform-resiliency': resiliencyMock,
    });
  });

  it('no input results in rejection', () => {

    const accessDetails = {
      accessToken: undefined,
      name: undefined,
      serviceEndpointBaseUrl: undefined,
    };

    const labelSelector: string = undefined;

    k8sKnativeService.getKnServicesOfNamespace(getRequestContextMock(), accessDetails, labelSelector).catch((e) => {
      expect(e.message).toEqual('serviceEndpointBaseUrl, accessToken, namespace and resourceKind must be set properly');
    }).catch((e) => {
      fail(e);
    });

  });

  it('fails due to 400 API response', () => {

    const accessDetails = {
      accessToken: 'something-stupid',
      name: 'namespace-for-getlist',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const labelSelector: string = undefined;

    k8sKnativeService.getKnServicesOfNamespace(getRequestContextMock(), accessDetails, labelSelector).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToGetApplicationError');
    }).catch((e) => {
      fail(e);
    });
  });

  it('fails due to broken API response', () => {
    const accessDetails = {
      accessToken: 'something-broken',
      name: 'namespace-for-getlist',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const labelSelector: string = undefined;

    k8sKnativeService.getKnServicesOfNamespace(getRequestContextMock(), accessDetails, labelSelector).catch((e) => {
      expect(e).toEqual(new SyntaxError('Unexpected token h in JSON at position 1'));
      expect(e.message).toEqual('Unexpected token h in JSON at position 1');
    }).catch((e) => {
      fail(e);
    });
  });

  it('returns a list of services', () => {
    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-getlist',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const labelSelector: string = undefined;

    k8sKnativeService.getKnServicesOfNamespace(getRequestContextMock(), accessDetails, labelSelector).then((list) => {
      const result = list.items;
      expect(result).toBeDefined();
      expect(result.length).toEqual(4);
      expect(result[0]).toBeDefined();
      expect(result[0].metadata).toBeDefined();
      expect(result[0].metadata.name).toMatch('my-monday--app');
    }).catch((e) => {
      fail(e);
    });
  });

});

describe('getKnServiceRevisions()', () => {
  let k8sKnativeService;

  beforeEach(() => {
    k8sKnativeService = proxyquire('../../../ts/services/k8s-knative-service', {
      '../utils/logger-utils': loggerUtilMock,
      '../utils/monitoring-utils': monitoringUtilsMock,
      '@console/console-platform-resiliency': resiliencyMock,
    });
  });

  it('no input results in rejection', () => {

    const accessDetails = {
      accessToken: undefined,
      name: undefined,
      serviceEndpointBaseUrl: undefined,
    };

    const labelSelector: string = undefined;

    k8sKnativeService.getKnServiceRevisions(getRequestContextMock(), accessDetails, labelSelector).catch((e) => {
      expect(e.message).toEqual('serviceEndpointBaseUrl, accessToken, namespace and resourceKind must be set properly');
    }).catch((e) => {
      fail(e);
    });

  });

  it('fails due to 400 API response', () => {

    const accessDetails = {
      accessToken: 'something-stupid',
      name: 'namespace-for-getlist',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const labelSelector: string = undefined;

    k8sKnativeService.getKnServiceRevisions(getRequestContextMock(), accessDetails, labelSelector).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToGetApplicationRevisionsError');
    }).catch((e) => {
      fail(e);
    });
  });

  it('fails due to broken API response', () => {

    const accessDetails = {
      accessToken: 'something-broken',
      name: 'namespace-for-getlist',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const labelSelector: string = undefined;

    k8sKnativeService.getKnServiceRevisions(getRequestContextMock(), accessDetails, labelSelector).catch((e) => {
      expect(e).toEqual(new SyntaxError('Unexpected token h in JSON at position 1'));
      expect(e.message).toEqual('Unexpected token h in JSON at position 1');
    }).catch((e) => {
      fail(e);
    });
  });

  it('returns a list of revisions', () => {

    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-getlist',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const labelSelector: string = undefined;

    k8sKnativeService.getKnServiceRevisions(getRequestContextMock(), accessDetails, labelSelector).then((result) => {
      expect(result).toBeDefined();
      expect(result.length).toEqual(1);
      expect(result[0]).toBeDefined();
      expect(result[0].metadata).toBeDefined();
      expect(result[0].metadata.name).toMatch('a-sample-is-a-sample');
    }).catch((e) => {
      fail(e);
    });
  });

});

describe('getKnServiceRoute()', () => {
  let k8sKnativeService;

  beforeEach(() => {
    k8sKnativeService = proxyquire('../../../ts/services/k8s-knative-service', {
      '../utils/logger-utils': loggerUtilMock,
      '../utils/monitoring-utils': monitoringUtilsMock,
      '@console/console-platform-resiliency': resiliencyMock,
    });
  });

  it('no input results in rejection', () => {

    const accessDetails = {
      accessToken: undefined,
      name: undefined,
      serviceEndpointBaseUrl: undefined,
    };

    const serviceName: string = undefined;
    const labelSelector: string = undefined;

    k8sKnativeService.getKnServiceRoute(getRequestContextMock(), accessDetails, serviceName, labelSelector).catch((e) => {
      expect(e.message).toEqual('serviceEndpointBaseUrl, accessToken, namespace, resourceName and resourceKind must be set properly');
    }).catch((e) => {
      fail(e);
    });

  });

  it('fails due to 400 API response', () => {

    const accessDetails = {
      accessToken: 'something-stupid',
      name: 'namespace-for-getobject',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const serviceName = 'foo';
    const labelSelector: string = undefined;

    k8sKnativeService.getKnServiceRoute(getRequestContextMock(), accessDetails, serviceName, labelSelector).catch((e) => {
      expect(e).toEqual({ status: 400 });
    }).catch((e) => {
      fail(e);
    });
  });

  it('fails due to broken API response', () => {

    const accessDetails = {
      accessToken: 'something-broken',
      name: 'namespace-for-getobject',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const serviceName = 'foo';
    const labelSelector: string = undefined;

    k8sKnativeService.getKnServiceRoute(getRequestContextMock(), accessDetails, serviceName, labelSelector).catch((e) => {
      expect(e).toEqual(new SyntaxError('Unexpected token h in JSON at position 1'));
      expect(e.message).toEqual('Unexpected token h in JSON at position 1');
    }).catch((e) => {
      fail(e);
    });
  });

  it('returns a route resource of service', () => {

    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-getobject',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const serviceName = 'foo';
    const labelSelector: string = undefined;

    k8sKnativeService.getKnServiceRoute(getRequestContextMock(), accessDetails, serviceName, labelSelector).then((result) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('Route');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.name).toEqual('a-sample-is-a-sample');
    }).catch((e) => {
      fail(e);
    });
  });

});

describe('getKnService()', () => {
  let k8sKnativeService;

  beforeEach(() => {
    k8sKnativeService = proxyquire('../../../ts/services/k8s-knative-service', {
      '../utils/logger-utils': loggerUtilMock,
      '../utils/monitoring-utils': monitoringUtilsMock,
      '@console/console-platform-resiliency': resiliencyMock,
    });
  });

  it('no input results in rejection', () => {

    const accessDetails = {
      accessToken: undefined,
      name: undefined,
      serviceEndpointBaseUrl: undefined,
    };

    const serviceName: string = undefined;
    const labelSelector: string = undefined;

    k8sKnativeService.getKnService(getRequestContextMock, accessDetails, serviceName, labelSelector).catch((e) => {
      expect(e.message).toEqual('serviceEndpointBaseUrl, accessToken, namespace, resourceName and resourceKind must be set properly');
    }).catch((e) => {
      fail(e);
    });

  });

  it('fails due to 400 API response', () => {

    const accessDetails = {
      accessToken: 'something-stupid',
      name: 'namespace-for-getobject',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const serviceName = 'foo';
    const labelSelector: string = undefined;

    k8sKnativeService.getKnService(getRequestContextMock, accessDetails, serviceName, labelSelector).catch((e) => {
      expect(e).toEqual({ status: 400 });
    }).catch((e) => {
      fail(e);
    });
  });

  it('fails due to broken API response', () => {

    const accessDetails = {
      accessToken: 'something-broken',
      name: 'namespace-for-getobject',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const serviceName = 'foo';
    const labelSelector: string = undefined;

    k8sKnativeService.getKnService(getRequestContextMock, accessDetails, serviceName, labelSelector).catch((e) => {
      expect(e).toEqual(new SyntaxError('Unexpected token h in JSON at position 1'));
      expect(e.message).toEqual('Unexpected token h in JSON at position 1');
    }).catch((e) => {
      fail(e);
    });
  });

  it('returns a service resource of service', () => {

    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-getobject',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };

    const serviceName = 'foo';
    const labelSelector: string = undefined;

    k8sKnativeService.getKnService(getRequestContextMock, accessDetails, serviceName, labelSelector).then((result) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('Service');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.name).toEqual('a-sample-is-a-sample');
    }).catch((e) => {
      fail(e);
    });
  });

});

describe('getKnServiceConfiguration()', () => {
  let k8sKnativeService;

  beforeEach(() => {
    k8sKnativeService = proxyquire('../../../ts/services/k8s-knative-service', {
      '../utils/logger-utils': loggerUtilMock,
      '../utils/monitoring-utils': monitoringUtilsMock,
      '@console/console-platform-resiliency': resiliencyMock,
    });
  });

  it('no input results in rejection', () => {

    const accessDetails = {
      accessToken: undefined,
      name: undefined,
      serviceEndpointBaseUrl: undefined,
    };
    const serviceName: string = undefined;
    const labelSelector: string = undefined;

    k8sKnativeService.getKnServiceConfiguration(getRequestContextMock(), accessDetails, serviceName, labelSelector).catch((e) => {
      expect(e.message).toEqual('serviceEndpointBaseUrl, accessToken, namespace, resourceName and resourceKind must be set properly');
    }).catch((e) => {
      fail(e);
    });

  });

  it('fails due to 400 API response', () => {

    const accessDetails = {
      accessToken: 'something-stupid',
      name: 'namespace-for-getobject',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const serviceName = 'foo';
    const labelSelector: string = undefined;

    k8sKnativeService.getKnServiceConfiguration(getRequestContextMock(), accessDetails, serviceName, labelSelector).catch((e) => {
      expect(e).toEqual({ status: 400 });
    }).catch((e) => {
      fail(e);
    });
  });

  it('fails due to broken API response', () => {

    const accessDetails = {
      accessToken: 'something-broken',
      name: 'namespace-for-getobject',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const serviceName = 'foo';
    const labelSelector: string = undefined;

    k8sKnativeService.getKnServiceConfiguration(getRequestContextMock(), accessDetails, serviceName, labelSelector).catch((e) => {
      expect(e).toEqual(new SyntaxError('Unexpected token h in JSON at position 1'));
      expect(e.message).toEqual('Unexpected token h in JSON at position 1');
    }).catch((e) => {
      fail(e);
    });
  });

  it('returns a configuration resource of service', () => {

    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-getobject',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const serviceName = 'foo';
    const labelSelector: string = undefined;

    k8sKnativeService.getKnServiceConfiguration(getRequestContextMock(), accessDetails, serviceName, labelSelector).then((result) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('Configuration');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.name).toEqual('a-sample-is-a-sample');
    }).catch((e) => {
      fail(e);
    });
  });

});

describe('createKnService()', () => {
  let k8sKnativeService;

  beforeEach(() => {
    k8sKnativeService = proxyquire('../../../ts/services/k8s-knative-service', {
      '../utils/logger-utils': loggerUtilMock,
      '../utils/monitoring-utils': monitoringUtilsMock,
      '@console/console-platform-resiliency': resiliencyMock,
    });
  });

  it('no input results in rejection', () => {

    const accessDetails = {
      accessToken: undefined,
      name: undefined,
      serviceEndpointBaseUrl: undefined,
    };
    let service: knativeModel.IKnativeService;

    k8sKnativeService.createKnService(getRequestContextMock(), accessDetails, service).catch((e) => {
      expect(e.message).toEqual('serviceEndpointBaseUrl, accessToken, namespace and service must be set properly');
    }).catch((e) => {
      fail(e);
    });

    service = undefined;

    k8sKnativeService.createKnService(getRequestContextMock(), accessDetails, service).catch((e) => {
      expect(e.message).toEqual('serviceEndpointBaseUrl, accessToken, namespace and service must be set properly');
    }).catch((e) => {
      fail(e);
    });

    service = {
      kind: 'Service',
      metadata: {
        name: 'foo'
      },
      spec: {
        template: {
          spec: {
            containerConcurrency: 1,
            containers: [{
              image: 'bar'
            }],
            timeoutSeconds: 180,
          }
        }
      }
    };
    k8sKnativeService.createKnService(getRequestContextMock(), accessDetails, service).catch((e) => {
      expect(e.message).toEqual('serviceEndpointBaseUrl, accessToken, namespace and service must be set properly');
    }).catch((e) => {
      fail(e);
    });

    service = {
      kind: 'Service',
      metadata: {
        name: 'foo'
      },
      spec: {
        template: {
          spec: {
            containerConcurrency: 1,
            containers: [{
              image: 'bar'
            }],
            timeoutSeconds: 180,
          },
        },
      }
    };

    k8sKnativeService.createKnService(getRequestContextMock(), accessDetails, service).catch((e) => {
      expect(e.message).toEqual('serviceEndpointBaseUrl, accessToken, namespace and service must be set properly');
    }).catch((e) => {
      fail(e);
    });

  });

  it('fails due to 400 API response', () => {

    const accessDetails = {
      accessToken: 'something-stupid',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const service: knativeModel.IKnativeService = {
      kind: 'Service',
      metadata: {
        name: 'foo'
      },
      spec: {
        template: {
          spec: {
            containerConcurrency: 1,
            containers: [{
              image: 'bar'
            }],
            timeoutSeconds: 180,
          },
        },
      }
    };

    // it is expected that the HTTP call returns an error (see mock -> accessToken=>something-sutpid)
    k8sKnativeService.createKnService(getRequestContextMock(), accessDetails, service).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToCreateApplicationError');
    }).catch((e) => {
      fail(e);
    });
  });

  it('fails due to broken API response', () => {

    const accessDetails = {
      accessToken: 'something-broken',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const service: knativeModel.IKnativeService = {
      kind: 'Service',
      metadata: {
        name: 'foo'
      },
      spec: {
        template: {
          spec: {
            containerConcurrency: 1,
            containers: [{
              image: 'bar'
            }],
            timeoutSeconds: 180,
          },
        },
      }
    };

    k8sKnativeService.createKnService(getRequestContextMock(), accessDetails, service).catch((e) => {
      expect(e).toEqual({ message: "Failed to create the Knative services of 'foo' within namespace 'namespace-for-creation'", status: 200 });
      expect(e.message).toEqual("Failed to create the Knative services of 'foo' within namespace 'namespace-for-creation'");
    }).catch((e) => {
      fail(e);
    });
  });

  it('fails due to bad input', (done) => {

    const accessDetails = {
      accessToken: 'something-invalid',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const service: knativeModel.IKnativeService = {
      kind: 'Service',
      metadata: {
        name: 'foo'
      },
      spec: {
        template: {
          spec: {
            containerConcurrency: 1,
            containers: [{
              image: 'bar'
            }],
            timeoutSeconds: 180,
          },
        },
      }
    };

    k8sKnativeService.createKnService(getRequestContextMock(), accessDetails, service)
      .catch((err) => {
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToCreateApplicationBecauseBadRequestError', _code: 101012 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('fails because service with same name exists', (done) => {

    const accessDetails = {
      accessToken: 'something-exists',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const service: knativeModel.IKnativeService = {
      kind: 'Service',
      metadata: {
        name: 'foo'
      },
      spec: {
        template: {
          spec: {
            containerConcurrency: 1,
            containers: [{
              image: 'bar'
            }],
            timeoutSeconds: 180,
          },
        },
      }
    };

    k8sKnativeService.createKnService(getRequestContextMock(), accessDetails, service)
      .catch((err) => {
        expect(err).toBeDefined();
        expect(err).toEqual(jasmine.objectContaining({ name: 'FailedToCreateApplicationBecauseAlreadyExistsError', _code: 101002 }));
        done();
      }).catch((e) => {
        done.fail(e);
      });
  });

  it('created a service resource', () => {

    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const service: knativeModel.IKnativeService = {
      kind: 'Service',
      metadata: {
        name: 'foo'
      },
      spec: {
        template: {
          spec: {
            containerConcurrency: 1,
            containers: [{
              image: 'bar'
            }],
            timeoutSeconds: 180,
          },
        },
      }
    };

    k8sKnativeService.createKnService(getRequestContextMock(), accessDetails, service).then((result) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('Service');
    }).catch((e) => {
      fail(e);
    });
  });

});

describe('createKnServiceRevision()', () => {
  let k8sKnativeService;

  beforeEach(() => {
    k8sKnativeService = proxyquire('../../../ts/services/k8s-knative-service', {
      '../utils/logger-utils': loggerUtilMock,
      '../utils/monitoring-utils': monitoringUtilsMock,
      '@console/console-platform-resiliency': resiliencyMock,
    });
  });

  it('no input results in rejection', () => {

    const accessDetails = {
      accessToken: undefined,
      name: undefined,
      serviceEndpointBaseUrl: undefined,
    };
    const serviceId: string = undefined;
    const knService: knativeModel.IKnativeService = undefined;

    k8sKnativeService.createKnServiceRevision(getRequestContextMock(), accessDetails, serviceId, knService).catch((e) => {
      expect(e.message).toEqual('serviceEndpointBaseUrl, accessToken, namespaceName, serviceId and knService must be set properly');
    }).catch((e) => {
      fail(e);
    });
  });

  it('fails due to 400 API response', () => {

    const accessDetails = {
      accessToken: 'something-stupid',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const serviceId: string = 'foo';
    const knService: knativeModel.IKnativeService = { apiVersion: 'serving.knative.dev/v1alpha1', kind: 'Service', metadata: { annotations: { 'serving.knative.dev/creator': 'IAM#foot@bar.com', 'serving.knative.dev/lastModifier': 'IAM#foot@bar.com' }, creationTimestamp: '2019-08-03T00:30:28Z', generation: 1, name: 'a-sample-is-a-sample', namespace: 'namespace2', uid: 'e4a017a1-b585-11e9-a788-6aa35994fc4d' }, spec: { template: { metadata: { name: 'a-sample-is-a-sample-00002', annotations: {} }, spec: { containerConcurrency: 10, timeoutSeconds: 300, containers: [{ image: 'docker.io/reggeenr/helloworld-nodejs', env: [{ name: 'some', value: 'value' }] }] } } }, status: { conditions: [{ lastTransitionTime: '2019-08-03T00:30:31Z', status: 'True', type: 'ConfigurationsReady' }, { lastTransitionTime: '2019-08-03T00:30:32Z', status: 'True', type: 'Ready' }, { lastTransitionTime: '2019-08-03T00:30:32Z', status: 'True', type: 'RoutesReady' }], latestCreatedRevisionName: 'a-sample-is-a-sample-fzjpl', latestReadyRevisionName: 'a-sample-is-a-sample-fzjpl', observedGeneration: 1, url: 'https://a-sample-is-a-sample-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud' } };

    k8sKnativeService.createKnServiceRevision(getRequestContextMock(), accessDetails, serviceId, knService).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToCreateApplicationRevisionError');
    }).catch((e) => {
      fail(e);
    });
  });

  it('fails due to broken API response', () => {

    const accessDetails = {
      accessToken: 'something-broken',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const serviceId: string = 'foo';
    const knService: knativeModel.IKnativeService = { apiVersion: 'serving.knative.dev/v1alpha1', kind: 'Service', metadata: { annotations: { 'serving.knative.dev/creator': 'IAM#foot@bar.com', 'serving.knative.dev/lastModifier': 'IAM#foot@bar.com' }, creationTimestamp: '2019-08-03T00:30:28Z', generation: 1, name: 'a-sample-is-a-sample', namespace: 'namespace2', uid: 'e4a017a1-b585-11e9-a788-6aa35994fc4d' }, spec: { template: { metadata: { name: 'a-sample-is-a-sample-00002', annotations: {} }, spec: { containerConcurrency: 10, timeoutSeconds: 300, containers: [{ image: 'docker.io/reggeenr/helloworld-nodejs', env: [{ name: 'some', value: 'value' }] }] } } }, status: { conditions: [{ lastTransitionTime: '2019-08-03T00:30:31Z', status: 'True', type: 'ConfigurationsReady' }, { lastTransitionTime: '2019-08-03T00:30:32Z', status: 'True', type: 'Ready' }, { lastTransitionTime: '2019-08-03T00:30:32Z', status: 'True', type: 'RoutesReady' }], latestCreatedRevisionName: 'a-sample-is-a-sample-fzjpl', latestReadyRevisionName: 'a-sample-is-a-sample-fzjpl', observedGeneration: 1, url: 'https://a-sample-is-a-sample-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud' } };

    k8sKnativeService.createKnServiceRevision(getRequestContextMock(), accessDetails, serviceId, knService).catch((e) => {
      expect(e).toEqual({ message: "Failed to create new revision of Knative services of 'foo' within namespace 'namespace-for-creation'", status: 200 });
      expect(e.message).toEqual("Failed to create new revision of Knative services of 'foo' within namespace 'namespace-for-creation'");
    }).catch((e) => {
      fail(e);
    });
  });

  it('created a service resource', () => {

    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-creation',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const serviceId: string = 'foo';
    const knService: knativeModel.IKnativeService = { apiVersion: 'serving.knative.dev/v1alpha1', kind: 'Service', metadata: { annotations: { 'serving.knative.dev/creator': 'IAM#foot@bar.com', 'serving.knative.dev/lastModifier': 'IAM#foot@bar.com' }, creationTimestamp: '2019-08-03T00:30:28Z', generation: 1, name: 'a-sample-is-a-sample', namespace: 'namespace2', uid: 'e4a017a1-b585-11e9-a788-6aa35994fc4d' }, spec: { template: { metadata: { name: 'a-sample-is-a-sample-00002', annotations: {} }, spec: { containerConcurrency: 10, timeoutSeconds: 300, containers: [{ image: 'docker.io/reggeenr/helloworld-nodejs', env: [{ name: 'some', value: 'value' }] }] } } }, status: { conditions: [{ lastTransitionTime: '2019-08-03T00:30:31Z', status: 'True', type: 'ConfigurationsReady' }, { lastTransitionTime: '2019-08-03T00:30:32Z', status: 'True', type: 'Ready' }, { lastTransitionTime: '2019-08-03T00:30:32Z', status: 'True', type: 'RoutesReady' }], latestCreatedRevisionName: 'a-sample-is-a-sample-fzjpl', latestReadyRevisionName: 'a-sample-is-a-sample-fzjpl', observedGeneration: 1, url: 'https://a-sample-is-a-sample-namespace2.kpi-ui-test-er.us-south.containers.appdomain.cloud' } };

    k8sKnativeService.createKnServiceRevision(getRequestContextMock(), accessDetails, serviceId, knService).then((result) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('Service');
    }).catch((e) => {
      fail(e);
    });
  });

  it('deleted a service resource', () => {

    const accessDetails = {
      accessToken: 'something-valid',
      name: 'namespace-for-deletion',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const serviceId: string = 'foo';

    k8sKnativeService.deleteKnService(getRequestContextMock(), accessDetails, serviceId).then((result: knativeModel.IKnativeStatus) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('Status');
      expect(result.status).toEqual('Success');
    }).catch((e) => {
      fail(e);
    });
  });

  it('failes deleted a service resource', () => {

    const accessDetails = {
      accessToken: 'something-broken',
      name: 'namespace-for-deletion',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const serviceId: string = 'foo';

    k8sKnativeService.deleteKnService(getRequestContextMock(), accessDetails, serviceId).catch((e) => {
      expect(e instanceof commonErrors.GenericUIError).toBeTruthy();
      expect(e.name).toEqual('FailedToDeleteApplicationError');
    }).catch((e) => {
      fail(e);
    });
  });
});
