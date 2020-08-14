import * as fs from 'fs';

// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as commonModel from '../../../../common/model/common-model';
import * as loggerUtil from '../../mocks/lib/console-platform-log4js-utils';

const resiliencyMock = {
  request: (options, callbackFn) => {
    const error = undefined;
    let response;
    let body;

    // selfsubjectaccessreviews
    if (options.method === 'POST' && options.path === '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews') {
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
      } else if (options.headers.Authorization.indexOf('something-forbidden') > -1) {
        response = {
          statusCode: 200
        };
        body = { kind: 'SelfSubjectAccessReview', apiVersion: 'authorization.k8s.io/v1', metadata: { creationTimestamp: null }, spec: { resourceAttributes: { namespace: 'default', verb: 'list', resource: 'namespaces' } }, status: { allowed: false, reason: 'RBAC: allowed by ClusterRoleBinding "ibm-admin" of ClusterRole "cluster-admin" to User "IAM#reggeenr@de.ibm.com"' } };
      } else {
        response = {
          statusCode: 200
        };
        body = { kind: 'SelfSubjectAccessReview', apiVersion: 'authorization.k8s.io/v1', metadata: { creationTimestamp: null }, spec: { resourceAttributes: { namespace: 'default', verb: 'list', resource: 'namespaces' } }, status: { allowed: true, reason: 'RBAC: allowed by ClusterRoleBinding "ibm-admin" of ClusterRole "cluster-admin" to User "IAM#reggeenr@de.ibm.com"' } };
      }
    }

    // getKubernetesNamespaceOfCluster
    if (options.method === 'GET' && options.path.startsWith('/api/v1/namespaces/')) {
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
      } else if (options.headers.Authorization.indexOf('something-not-found') > -1) {
        response = {
          statusCode: 404
        };
        body = '{ "kind": "Status", "apiVersion": "v1", "metadata": {}, "status": "Failure", "message": "namespaces \"namespace5\" not found", "reason": "NotFound", "details": { "name": "namespace5", "kind": "namespaces" }, "code": 404 }';
      } else {
        response = {
          statusCode: 200
        };
        body = '{ "kind": "Namespace", "apiVersion": "v1", "metadata": { "name": "namespace1", "selfLink": "/api/v1/namespaces/namespace1", "uid": "0af63ab4-9e37-11e9-a1be-1e6967a1a980", "resourceVersion": "15120", "creationTimestamp": "2019-07-04T08:38:05Z", "labels": { "ibm-managed": "true" } }, "spec": { "finalizers": ["kubernetes"] }, "status": { "phase": "Active" } }';
      }
    }

    // getKubernetesNamespacesOfCluster
    if (options.method === 'GET' && options.path === '/api/v1/namespaces?limit=500') {
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
        body = '{ "kind": "NamespaceList", "apiVersion": "v1", "metadata": { "selfLink": "/api/v1/namespaces", "resourceVersion": "5541371" }, "items": [{ "metadata": { "name": "default", "selfLink": "/api/v1/namespaces/default", "uid": "e3e03b56-9e2c-11e9-acfc-669e4d559aa3", "resourceVersion": "19", "creationTimestamp": "2019-07-04T07:25:25Z" }, "spec": { "finalizers": ["kubernetes"] }, "status": { "phase": "Active" } }, { "metadata": { "name": "ibm-cert-store", "selfLink": "/api/v1/namespaces/ibm-cert-store", "uid": "18d4820c-9e2e-11e9-acfc-669e4d559aa3", "resourceVersion": "1162", "creationTimestamp": "2019-07-04T07:34:03Z" }, "spec": { "finalizers": ["kubernetes"] }, "status": { "phase": "Active" } }, { "metadata": { "name": "ibm-system", "selfLink": "/api/v1/namespaces/ibm-system", "uid": "20c08f95-9e2d-11e9-acfc-669e4d559aa3", "resourceVersion": "351", "creationTimestamp": "2019-07-04T07:27:07Z" }, "spec": { "finalizers": ["kubernetes"] }, "status": { "phase": "Active" } }, { "metadata": { "name": "istio-system", "selfLink": "/api/v1/namespaces/istio-system", "uid": "73866273-9e36-11e9-93ce-129d681d8bd2", "resourceVersion": "8206", "creationTimestamp": "2019-07-04T08:33:51Z", "labels": { "addonmanager.kubernetes.io/mode": "Reconcile" }, "annotations": { "armada-service": "addon-istio", "kubectl.kubernetes.io/last-applied-configuration": "", "version": "786cf0d1f7d31ed832fe6def22550482647f400c" } }, "spec": { "finalizers": ["kubernetes"] }, "status": { "phase": "Active" } }, { "metadata": { "name": "knative-build", "selfLink": "/api/v1/namespaces/knative-build", "uid": "77d7c606-9e36-11e9-93ce-129d681d8bd2", "resourceVersion": "8722", "creationTimestamp": "2019-07-04T08:33:58Z", "labels": { "addonmanager.kubernetes.io/mode": "Reconcile" }, "annotations": { "armada-service": "addon-knative", "kubectl.kubernetes.io/last-applied-configuration": "", "version": "c070d6800b9105033d02052d27f7525fe3e9022b" } }, "spec": { "finalizers": ["kubernetes"] }, "status": { "phase": "Active" } }, { "metadata": { "name": "knative-eventing", "selfLink": "/api/v1/namespaces/knative-eventing", "uid": "77dafc96-9e36-11e9-93ce-129d681d8bd2", "resourceVersion": "8724", "creationTimestamp": "2019-07-04T08:33:58Z", "labels": { "addonmanager.kubernetes.io/mode": "Reconcile" }, "annotations": { "armada-service": "addon-knative", "kubectl.kubernetes.io/last-applied-configuration": "", "version": "c070d6800b9105033d02052d27f7525fe3e9022b" } }, "spec": { "finalizers": ["kubernetes"] }, "status": { "phase": "Active" } }, { "metadata": { "name": "knative-monitoring", "selfLink": "/api/v1/namespaces/knative-monitoring", "uid": "77de3cf1-9e36-11e9-93ce-129d681d8bd2", "resourceVersion": "8727", "creationTimestamp": "2019-07-04T08:33:58Z", "labels": { "addonmanager.kubernetes.io/mode": "Reconcile", "serving.knative.dev/release": "v0.6.0" }, "annotations": { "armada-service": "addon-knative", "kubectl.kubernetes.io/last-applied-configuration": "", "version": "c070d6800b9105033d02052d27f7525fe3e9022b" } }, "spec": { "finalizers": ["kubernetes"] }, "status": { "phase": "Active" } }, { "metadata": { "name": "knative-serving", "selfLink": "/api/v1/namespaces/knative-serving", "uid": "77e185fc-9e36-11e9-93ce-129d681d8bd2", "resourceVersion": "8731", "creationTimestamp": "2019-07-04T08:33:58Z", "labels": { "addonmanager.kubernetes.io/mode": "Reconcile", "istio-injection": "enabled", "serving.knative.dev/release": "v0.6.0" }, "annotations": { "armada-service": "addon-knative", "kubectl.kubernetes.io/last-applied-configuration": "", "version": "c070d6800b9105033d02052d27f7525fe3e9022b" } }, "spec": { "finalizers": ["kubernetes"] }, "status": { "phase": "Active" } }, { "metadata": { "name": "knative-sources", "selfLink": "/api/v1/namespaces/knative-sources", "uid": "77e4c09b-9e36-11e9-93ce-129d681d8bd2", "resourceVersion": "8733", "creationTimestamp": "2019-07-04T08:33:58Z", "labels": { "addonmanager.kubernetes.io/mode": "Reconcile" }, "annotations": { "armada-service": "addon-knative", "kubectl.kubernetes.io/last-applied-configuration": "", "version": "c070d6800b9105033d02052d27f7525fe3e9022b" } }, "spec": { "finalizers": ["kubernetes"] }, "status": { "phase": "Active" } }, { "metadata": { "name": "kube-public", "selfLink": "/api/v1/namespaces/kube-public", "uid": "e3fc21d3-9e2c-11e9-acfc-669e4d559aa3", "resourceVersion": "38", "creationTimestamp": "2019-07-04T07:25:25Z" }, "spec": { "finalizers": ["kubernetes"] }, "status": { "phase": "Active" } }, { "metadata": { "name": "kube-system", "selfLink": "/api/v1/namespaces/kube-system", "uid": "e3f8ea1f-9e2c-11e9-acfc-669e4d559aa3", "resourceVersion": "37", "creationTimestamp": "2019-07-04T07:25:25Z" }, "spec": { "finalizers": ["kubernetes"] }, "status": { "phase": "Active" } }, { "metadata": { "name": "namespace1", "selfLink": "/api/v1/namespaces/namespace1", "uid": "0af63ab4-9e37-11e9-a1be-1e6967a1a980", "resourceVersion": "15120", "creationTimestamp": "2019-07-04T08:38:05Z", "labels": { "ibm-managed": "true" } }, "spec": { "finalizers": ["kubernetes"] }, "status": { "phase": "Active" } }, { "metadata": { "name": "namespace2", "selfLink": "/api/v1/namespaces/namespace2", "uid": "95f4593c-9e39-11e9-93ce-129d681d8bd2", "resourceVersion": "13287", "creationTimestamp": "2019-07-04T08:56:17Z" }, "spec": { "finalizers": ["kubernetes"] }, "status": { "phase": "Active" } }] }';
      }
    }

    // getKubernetesPodsOfNamespace
    if (options.method === 'GET' && options.path === '/api/v1/namespaces/my-namespace/pods?limit=500') {
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
      } else if (options.headers.Authorization.indexOf('something-empty') > -1) {
        response = {
          statusCode: 200
        };
        body = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s/get-pods-of-namespace-empty.json', 'utf8'));
      } else {
        response = {
          statusCode: 200
        };
        body = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s/get-pods-of-namespace-ok.json', 'utf8'));
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

describe('k8sService', () => {
  let k8sService;
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = OLD_ENV;

    // deleting the currentValues properties that are necessary to test locally
    delete process.env.WORKAROUND_IAM_ACCESS_TOKEN;
    delete process.env.WORKAROUND_IAM_REFRESH_TOKEN;

    k8sService = proxyquire('../../../ts/services/k8s-service', {
      '../utils/logger-utils': loggerUtil,
      './../utils/monitoring-utils': monitoringUtilsMock,
      '@console/console-platform-resiliency': resiliencyMock,
    });
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('transformNamespacesResponse() namespace response will be transformed', () => {

    let namespace;
    expect(k8sService.transformNamespacesResponse(namespace)).toBeNull();

    namespace = {};
    expect(k8sService.transformNamespacesResponse(namespace)).toBeNull();

    namespace = { metadata: {} };
    expect(k8sService.transformNamespacesResponse(namespace)).toEqual(namespace);

    namespace = { metadata: { foo: 'bar' } };
    expect(k8sService.transformNamespacesResponse(namespace)).toEqual(namespace);
  });

  it('isUserAllowedTo() - can-i check fails if input params are not set properly', () => {
    const accessDetails = {
      accessToken: undefined,
      name: undefined,
      serviceEndpointBaseUrl: undefined,
    };
    const verb: string = undefined;
    const resource: string = undefined;

    k8sService.isUserAllowedTo(getRequestContextMock(), accessDetails, verb, resource).then((result) => {
      expect(result).toBeDefined();
      expect(result.allowed).toBeFalsy();
    }).catch((e) => {
      fail(e);
    });
  });

  it('isUserAllowedTo() - can-i check fails due to 400 API response', () => {
    const accessDetails = {
      accessToken: 'something-stupid',
      name: 'foo',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const verb = 'bar';
    const resource = 'foobar';

    k8sService.isUserAllowedTo(getRequestContextMock(), accessDetails, verb, resource).then((result) => {
      expect(result).toBeDefined();
      expect(result.allowed).toBeFalsy();
    }).catch((e) => {
      fail(e);
    });
  });

  it('isUserAllowedTo() - can-i check fails due to broken API response', () => {
    const accessDetails = {
      accessToken: 'something-broken',
      name: 'foo',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const verb = 'bar';
    const resource = 'foobar';

    k8sService.isUserAllowedTo(getRequestContextMock(), accessDetails, verb, resource).then((result) => {
      expect(result).toBeDefined();
      expect(result.allowed).toBeFalsy();
    }).catch((e) => {
      fail(e);
    });
  });

  it('isUserAllowedTo() - can-i check indicates forbidden', () => {
    const accessDetails = {
      accessToken: 'something-forbidden',
      name: 'foo',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const verb = 'bar';
    const resource = 'foobar';

    k8sService.isUserAllowedTo(getRequestContextMock(), accessDetails, verb, resource).then((result) => {
      expect(result).toBeDefined();
      expect(result.allowed).toBeFalsy();
    }).catch((e) => {
      fail(e);
    });
  });

  it('isUserAllowedTo() - can-i check passes', () => {
    const accessDetails = {
      accessToken: 'something-valid',
      name: 'foo',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    const verb = 'bar';
    const resource = 'foobar';

    k8sService.isUserAllowedTo(getRequestContextMock(), accessDetails, verb, resource).then((result) => {
      expect(result).toBeDefined();
      expect(result.allowed).toBeTruthy();
    }).catch((e) => {
      fail(e);
    });
  });

  it('getKubernetesNamespacesOfCluster() - fails if input params are not set properly', () => {
    const accessDetails = {
      accessToken: undefined,
      name: undefined,
      serviceEndpointBaseUrl: undefined,
    };
    k8sService.getKubernetesNamespaceOfCluster(getRequestContextMock(), accessDetails).catch((e) =>
      expect(e).toEqual(new Error('namespaceNameOrId, serviceEndpointBaseUrl and accessToken must be set properly'))
    ).catch((e) => {
      fail(e);
    });
  });

  it('getKubernetesNamespacesOfCluster() - fails due to 400 API response', () => {
    const accessDetails = {
      accessToken: 'something-stupid',
      name: 'foo',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    k8sService.getKubernetesNamespaceOfCluster(getRequestContextMock(), accessDetails).catch((e) =>
      expect(e).toEqual({ status: 400 })
    ).catch((e) =>
      fail(e)
    );
  });

  it('getKubernetesNamespacesOfCluster() - fails due to broken  API response', () => {
    const accessDetails = {
      accessToken: 'something-broken',
      name: 'foo',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    k8sService.getKubernetesNamespaceOfCluster(getRequestContextMock(), accessDetails).catch((e) => {
      expect(e).toEqual(new SyntaxError('Unexpected token h in JSON at position 1'));
      expect(e.message).toEqual('Unexpected token h in JSON at position 1');
    }).catch((e) =>
      fail(e)
    );
  });

  it('getKubernetesNamespacesOfCluster() - fails due to 404 API response', () => {
    const accessDetails = {
      accessToken: 'something-not-found',
      name: 'foo',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    k8sService.getKubernetesNamespaceOfCluster(getRequestContextMock(), accessDetails).catch((e) =>
      expect(e).toEqual({ status: 404 })
    ).catch((e) =>
      fail(e)
    );
  });

  it('getKubernetesNamespacesOfCluster() - returns a valid namespace', () => {
    const accessDetails = {
      accessToken: 'something-valid',
      name: 'foo',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    k8sService.getKubernetesNamespaceOfCluster(getRequestContextMock(), accessDetails).then((result) => {
      expect(result).toBeDefined();
      expect(result.kind).toEqual('Namespace');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.name).toEqual('namespace1');
    }).catch((e) =>
      fail(e)
    );
  });

  it('getKubernetesNamespacesOfCluster() - fails if input params are not set properly', () => {
    const accessDetails = {
      accessToken: undefined,
      name: undefined,
      serviceEndpointBaseUrl: undefined,
    };
    k8sService.getKubernetesNamespacesOfCluster(getRequestContextMock(), accessDetails).catch((e) =>
      expect(e).toEqual(new Error('serviceEndpointBaseUrl and accessToken must be set properly'))
    ).catch((e) =>
      fail(e)
    );
  });

  it('getKubernetesNamespacesOfCluster() - fails due to 400 API response', () => {
    const accessDetails = {
      accessToken: 'something-stupid',
      name: 'foo',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    k8sService.getKubernetesNamespacesOfCluster(getRequestContextMock(), accessDetails).catch((e) =>
      expect(e).toEqual({ status: 400 })
    ).catch((e) =>
      fail(e)
    );
  });

  it('getKubernetesNamespacesOfCluster() - fails due to broken API response', () => {
    const accessDetails = {
      accessToken: 'something-broken',
      name: 'foo',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    k8sService.getKubernetesNamespacesOfCluster(getRequestContextMock(), accessDetails).catch((e) => {
      expect(e).toEqual(new SyntaxError('Unexpected token h in JSON at position 1'));
      expect(e.message).toEqual('Unexpected token h in JSON at position 1');
    }).catch((e) =>
      fail(e)
    );
  });

  it('getKubernetesNamespacesOfCluster() - returns a list of namespaces', () => {
    const accessDetails = {
      accessToken: 'something-valid',
      name: 'foo',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    k8sService.getKubernetesNamespacesOfCluster(getRequestContextMock(), accessDetails).then((result) => {
      expect(result).toBeDefined();
      expect(result.length).toEqual(13);
      expect(result[0]).toBeDefined();
      expect(result[0].metadata).toBeDefined();
      expect(result[0].metadata.name).toEqual('default');
    }).catch((e) =>
      fail(e)
    );
  });

  it('getKubernetesPodsOfNamespace() - fails due to 400 API response', () => {
    const accessDetails = {
      accessToken: 'something-stupid',
      name: 'my-namespace',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    k8sService.getKubernetesPodsOfNamespace(getRequestContextMock(), accessDetails).catch((e) =>
      expect(e).toEqual({ status: 400 })
    ).catch((e) =>
      fail(e)
    );
  });

  it('getKubernetesPodsOfNamespace() - fails due to broken API response', () => {
    const accessDetails = {
      accessToken: 'something-broken',
      name: 'my-namespace',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    k8sService.getKubernetesPodsOfNamespace(getRequestContextMock(), accessDetails).catch((e) => {
      expect(e).toEqual(new SyntaxError('Unexpected token h in JSON at position 1'));
      expect(e.message).toEqual('Unexpected token h in JSON at position 1');
    }).catch((e) =>
      fail(e)
    );
  });

  it('getKubernetesPodsOfNamespace() - returns an empty list of pods', () => {
    const accessDetails = {
      accessToken: 'something-empty',
      name: 'my-namespace',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    k8sService.getKubernetesPodsOfNamespace(getRequestContextMock(), accessDetails).then((result) => {
      expect(result).toBeDefined();
      expect(result.length).toEqual(0);
    }).catch((e) =>
      fail(e)
    );
  });

  it('getKubernetesPodsOfNamespace() - returns a list of pods', () => {
    const accessDetails = {
      accessToken: 'something-valid',
      name: 'my-namespace',
      serviceEndpointBaseUrl: 'https://some.iks.server',
    };
    k8sService.getKubernetesPodsOfNamespace(getRequestContextMock(), accessDetails).then((result) => {
      expect(result).toBeDefined();
      expect(result.length).toEqual(3);
      expect(result[0]).toBeDefined();
      expect(result[0].metadata.name).toBeDefined();
      expect(result[0].metadata.name).toEqual('default');
    }).catch((e) =>
      fail(e)
    );
  });
});
