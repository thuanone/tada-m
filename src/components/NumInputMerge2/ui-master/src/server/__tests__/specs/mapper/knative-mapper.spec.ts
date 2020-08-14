import * as fs from 'fs';
import * as appModel from '../../../../common/model/application-model';
import * as commonModel from '../../../../common/model/common-model';
import * as knativeModel from '../../../ts/model/knative-model';

// tslint:disable-next-line:no-var-requires
const proxyquire = require('proxyquire').noCallThru();
import * as loggerUtil from '../../mocks/lib/console-platform-log4js-utils';
import { IUIEnvItemLiteral } from '../../../../common/model/common-model';

describe('knative mapper', () => {
  let knativeMapper: any;

  beforeEach(() => {
    knativeMapper = proxyquire('../../../ts/mapper/knative-mapper', {
      '@console/console-platform-log4js-utils': loggerUtil,
    });
  });

  it('returns null if the given input is invalid', () => {
    // input is undefined
    let resource: any;
    let result = knativeMapper.serviceToApplication(resource);
    expect(result).toBeUndefined();

    // input is empty
    resource = {};
    result = knativeMapper.serviceToApplication(resource);
    expect(result).toBeUndefined();

    // input is a string
    resource = 'string';
    result = knativeMapper.serviceToApplication(resource);
    expect(result).toBeUndefined();

    // input is defined but does not have an ID
    resource = { foo: 'bar'};
    result = knativeMapper.serviceToApplication(resource);
    expect(result).toBeUndefined();
  });

  it('returns an application if all criteria are matching', () => {
    // input is defined
    const resource = {
      kind: 'Service',
      metadata: {
        name: 'some-sample',
      }
    };

    const regionId: string = 'foo';
    const projectId: string = 'bar';

    const result: appModel.IUIApplication = knativeMapper.serviceToApplication(resource, regionId, projectId);
    expect(result).toBeDefined();
    expect(result.name).toEqual('some-sample');
    expect(result.namespace).toBeUndefined();
    expect(result.regionId).toEqual(regionId);
    expect(result.projectId).toEqual(projectId);

    expect(result.status).toEqual(commonModel.UIEntityStatus.FAILED);
    expect(result.publicServiceUrl).toBeUndefined();
    expect(result.generation).toEqual(1);
    expect(result.latestCreatedRevisionName).toBeUndefined();
    expect(result.latestReadyRevisionName).toBeUndefined();
  });

  it('wont fail if NO //spec/template/spec/containers[]/container is set', () => {
    // input is defined
    const resource = {
      kind: 'Service',
      metadata: {
        name: 'some-sample',
      },
      spec: {
        template: {
          spec: {
            containers: {},
          },
        },
      },
    };

    const regionId: string = 'foo';
    const projectId: string = 'bar';

    const result: appModel.IUIApplication = knativeMapper.serviceToApplication(resource, regionId, projectId);
    expect(result).toBeDefined();
    expect(result.template).toBeDefined();
    expect(result.template.cpus).toBeUndefined();
    expect(result.template.memory).toBeUndefined();
    expect(result.template.image).toBeUndefined();
    expect(result.template.parameters).toBeUndefined();
    expect(result.template.minScale).toBeUndefined();
    expect(result.template.maxScale).toBeUndefined();
    expect(result.template.timeoutSeconds).toBeUndefined();
    expect(result.template.containerConcurrency).toBeUndefined();
  });

  it('wont fail if NO //spec/template/spec is set', () => {
    // input is defined
    const resource = {
      kind: 'Service',
      metadata: {
        name: 'some-sample',
      },
      spec: {
        template: {
        },
      },
    };

    const regionId: string = 'foo';
    const projectId: string = 'bar';

    const result: appModel.IUIApplication = knativeMapper.serviceToApplication(resource, regionId, projectId);
    expect(result).toBeDefined();
    expect(result.template).toBeDefined();
    expect(result.template.cpus).toBeUndefined();
    expect(result.template.memory).toBeUndefined();
    expect(result.template.image).toBeUndefined();
    expect(result.template.parameters).toBeUndefined();
    expect(result.template.minScale).toBeUndefined();
    expect(result.template.maxScale).toBeUndefined();
    expect(result.template.timeoutSeconds).toBeUndefined();
    expect(result.template.containerConcurrency).toBeUndefined();
  });

  it('wont fail if NO //spec/template is set', () => {
    // input is defined
    const resource = {
      kind: 'Service',
      metadata: {
        name: 'some-sample',
      },
      spec: {
      },
    };

    const regionId: string = 'foo';
    const projectId: string = 'bar';

    const result: appModel.IUIApplication = knativeMapper.serviceToApplication(resource, regionId, projectId);
    expect(result).toBeDefined();
    expect(result.template).toBeDefined();
    expect(result.template.cpus).toBeUndefined();
    expect(result.template.memory).toBeUndefined();
    expect(result.template.image).toBeUndefined();
    expect(result.template.parameters).toBeUndefined();
    expect(result.template.minScale).toBeUndefined();
    expect(result.template.maxScale).toBeUndefined();
    expect(result.template.timeoutSeconds).toBeUndefined();
    expect(result.template.containerConcurrency).toBeUndefined();
  });

  it('can handle "0" properly', () => {
    // input is defined
    const resource = {
      kind: 'Service',
      metadata: {
        name: 'some-sample',
      },
      spec: {
        template: {
          metadata: {
            annotations: {
              'autoscaling.knative.dev/maxScale': '0',
              'autoscaling.knative.dev/minScale': '0'
            },
          },
          spec: {
            containerConcurrency: 0,
            containers: [{
              image: undefined,
              resources: {
                requests: {
                  cpu: '0',
                  memory: '0',
                }
              }
            }],
            timeoutSeconds: 0,
          },
        },
      },
    };

    const regionId: string = 'foo';
    const projectId: string = 'bar';

    const result: appModel.IUIApplication = knativeMapper.serviceToApplication(resource, regionId, projectId);
    expect(result).toBeDefined();
    expect(result.template).toBeDefined();
    expect(result.template.cpus).toEqual(0);
    expect(result.template.memory).toEqual(0);
    expect(result.template.image).toBeUndefined();
    expect(result.template.parameters).toBeUndefined();
    expect(result.template.minScale).toEqual(0);
    expect(result.template.maxScale).toEqual(0);
    expect(result.template.timeoutSeconds).toEqual(0);
    expect(result.template.containerConcurrency).toEqual(0);
  });

  it('converts a real-life knative service resource', () => {
    // read the knative service from file
    const resource: any = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-knative/get-service_response-ok.json', 'utf8'));

    const result: appModel.IUIApplication = knativeMapper.serviceToApplication(resource);
    expect(result).toBeDefined();
    expect(result.name).toEqual('some-application');
    expect(result.namespace).toEqual('dc06f6638837');

    expect(result.status).toEqual(commonModel.UIEntityStatus.READY);
    expect(result.publicServiceUrl).toEqual('http://some-application.dc06f6638837.stage.coligo.functions.test.appdomain.cloud');
    expect(result.generation).toEqual(6);
    expect(result.latestCreatedRevisionName).toEqual('some-application-mgwml-4');
    expect(result.latestReadyRevisionName).toEqual('some-application-mgwml-4');

    // check the app template
    expect(result.template).toBeDefined();
    expect(result.template.cpus).toEqual(2);
    expect(result.template.memory).toEqual(536870912); // 512Mi
    expect(result.template.image).toEqual('index.docker.io/foobar/helloworld');
    expect(result.template.parameters).toBeUndefined();
    expect(result.template.minScale).toEqual(0);
    expect(result.template.maxScale).toEqual(2);
    expect(result.template.timeoutSeconds).toEqual(300);
    expect(result.template.containerConcurrency).toEqual(0);
  });

  it('converts a real-life knative service resource from a service that has no valid revision', () => {
    // read the knative service from file
    const resource: any = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-knative/get-service_response-failing.json', 'utf8'));

    const result: appModel.IUIApplication = knativeMapper.serviceToApplication(resource);
    expect(result).toBeDefined();
    expect(result.name).toEqual('yeah');
    expect(result.namespace).toEqual('dc06f6638837');

    expect(result.status).toEqual(commonModel.UIEntityStatus.FAILED);
    expect(result.publicServiceUrl).toEqual('http://yeah.dc06f6638837.stage.coligo.functions.test.appdomain.cloud');
    expect(result.generation).toEqual(1);
    expect(result.latestCreatedRevisionName).toEqual('yeah-nppqx-1');
    expect(result.latestReadyRevisionName).toBeUndefined();
  });

  it('converts a set of knative service resources to applications', () => {
    // read the knative revisions from file
    const resources: any = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-knative/get-services_response-ok.json', 'utf8'));

    const result: appModel.IUIApplication[] = knativeMapper.servicesToApplications(resources);
    expect(result).toBeDefined();
    expect(result.length).toEqual(24);
    expect(result[0].namespace).toEqual('dc06f6638837');
    expect(result[0].name).toEqual('coligo-e2etest-app--biuid');
  });

  it('does NOT fail if the metadata labels are missing', () => {
    // use a synthetic revision
    let resource: any = {
      metadata: {
        labels: {
          'serving.knative.dev/configurationGeneration': '5',
        },
        name: 'foo-bar-wdhtt-5',
      },
    };

    let result: appModel.IUIApplicationRevision = knativeMapper.revisionToAppRevision(resource);
    expect(result).toBeDefined();
    expect(result.name).toEqual('foo-bar-wdhtt-5');
    expect(result.generation).toEqual(5);

    // this time the label that we meed to read the generation is not set
    resource = {
      metadata: {
        labels: {
        },
        name: 'foo-bar-wdhtt-5',
      },
    };

    result = knativeMapper.revisionToAppRevision(resource);
    expect(result).toBeDefined();
    expect(result.name).toEqual('foo-bar-wdhtt-5');
    expect(result.generation).toEqual(1);

    // this time the label property is not set
    resource = {
      metadata: {
        name: 'foo-bar-wdhtt-5',
      },
    };

    result = knativeMapper.revisionToAppRevision(resource);
    expect(result).toBeDefined();
    expect(result.name).toEqual('foo-bar-wdhtt-5');
    expect(result.generation).toEqual(1);
  });

  it('does NOT fail if the given revision is malformed', () => {
    // The revision does not have have a proper //metadata/name
    let resource: any = {
      metadata: {
      },
    };

    let result: appModel.IUIApplicationRevision = knativeMapper.revisionToAppRevision(resource);
    expect(result).toBeUndefined();

    // this time the revision is empty
    resource = {
    };

    result = knativeMapper.revisionToAppRevision(resource);
    expect(result).toBeUndefined();

    // this time the revision is undefined
    resource = undefined;

    result = knativeMapper.revisionToAppRevision(resource);
    expect(result).toBeUndefined();
  });

  it('converts a knative revision resource to an app revision', () => {
    // read the knative revision from file
    const resource: any = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-knative/get-service-revision_response-ok.json', 'utf8'));

    const result: appModel.IUIApplicationRevision = knativeMapper.revisionToAppRevision(resource);
    expect(result).toBeDefined();
    expect(result.name).toEqual('foo-bar-wdhtt-5');
    expect(result.namespace).toEqual('dc06f6638837');
    expect(result.image).toEqual('index.docker.io/foobar/helloworld@sha256:be18cb80f43d8548ceb26adb0e4d53ed0d1fec71948dd88633265386394050bc');
    expect(result.cpus).toEqual(1);
    expect(result.memory).toEqual(536870912);
    expect(result.containerConcurrency).toEqual(5);
    expect(result.timeoutSeconds).toEqual(300);
    expect(result.minScale).toEqual(1);
    expect(result.maxScale).toEqual(2);
    expect(result.created).toEqual(1582574483000);

    expect(result.status).toEqual(commonModel.UIEntityStatus.READY);
    expect(result.generation).toEqual(5);
    expect((result.parameters[0] as IUIEnvItemLiteral).name).toEqual('TARGET');
    expect((result.parameters[0] as IUIEnvItemLiteral).value).toEqual('Coligo');
  });

  it('does not fail if the given revisions are malformed', () => {
    // the given resources are malformed
    let resources: any;
    let result: appModel.IUIApplicationRevision[] = knativeMapper.revisionsToAppRevisions(resources);
    expect(result).toBeUndefined();

    resources = {};
    result = knativeMapper.revisionsToAppRevisions(resources);
    expect(result).toBeUndefined();
  });

  it('does not fail if the given services are malformed', () => {
    // the given resources are malformed
    let resources: any;
    let result: appModel.IUIApplicationRevision[] = knativeMapper.servicesToApplications(resources);
    expect(result).toBeUndefined();

    resources = {};
    result = knativeMapper.servicesToApplications(resources);
    expect(result).toBeUndefined();
  });

  it('converts a set of knative revision resource to app revisions', () => {
    // read the knative revisions from file
    const resources: any = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-knative/get-service-revisions_response-ok.json', 'utf8'));

    const result: appModel.IUIApplicationRevision[] = knativeMapper.revisionsToAppRevisions(resources);
    expect(result).toBeDefined();
    expect(result.length).toEqual(4);
    expect(result[0].namespace).toEqual('dc06f6638837');
    expect(result[0].name).toEqual('some-application-mgwml-4');
  });

  it('converts a route of a valid service to an app route', () => {
    // read the knative route from file
    const resource: any = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-knative/get-service-route_response-ok.json', 'utf8'));

    const result: appModel.IUIApplicationRoute = knativeMapper.routeToAppRoute(resource);
    expect(result).toBeDefined();
    expect(result.trafficTargets).toBeDefined();
    expect(Object.keys(result.trafficTargets).length).toEqual(1);
    expect(result.trafficTargets['some-application-zfmrt-3']).toEqual(100);
    expect(result.routingTags).toBeDefined();
    expect(Object.keys(result.routingTags).length).toEqual(1);
    expect(result.routingTags['some-application-zfmrt-3']).toEqual(['blue', 'green']);
  });

  it('converts a route of a service that has no ready revisions to an app route', () => {
    // read the knative route from file
    const resource: any = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-knative/get-service-route_response-failing.json', 'utf8'));

    const result: appModel.IUIApplicationRoute = knativeMapper.routeToAppRoute(resource);
    expect(result).toBeDefined();
    expect(result.trafficTargets).toBeDefined();
    expect(Object.keys(result.trafficTargets).length).toEqual(0);
    expect(result.routingTags).toBeDefined();
    expect(Object.keys(result.routingTags).length).toEqual(0);
  });

  it('converts a route of a service that has a ready revision which receives all the traffic to an app route', () => {
    // read the knative route from file
    const resource: any = JSON.parse(fs.readFileSync('src/server/__tests__/mocks/backends/k8s-knative/get-service-route_response_2-ok.json', 'utf8'));

    const result: appModel.IUIApplicationRoute = knativeMapper.routeToAppRoute(resource);
    expect(result).toBeDefined();
    expect(result.trafficTargets).toBeDefined();
    expect(Object.keys(result.trafficTargets).length).toEqual(1);
    expect(result.trafficTargets['hey-hey-vjhc6']).toEqual(100);
    expect(result.routingTags).toBeDefined();
    expect(Object.keys(result.routingTags).length).toEqual(1);
    expect(result.routingTags['hey-hey-vjhc6']).toEqual(['latest']);
  });

  it('refuses to convert to an app route, in case of invalid input', () => {
    // given resource is undefined
    let resource: any;
    let result: appModel.IUIApplicationRoute = knativeMapper.routeToAppRoute(resource);
    expect(result).toBeUndefined();

    // given resource is null
    resource = null;
    result = knativeMapper.routeToAppRoute(resource);
    expect(result).toBeUndefined();

    resource = {};
    result = knativeMapper.routeToAppRoute(resource);
    expect(result).toBeDefined();
    expect(result.trafficTargets).toBeDefined();
    expect(Object.keys(result.trafficTargets).length).toEqual(0);
    expect(result.routingTags).toBeDefined();
    expect(Object.keys(result.routingTags).length).toEqual(0);

    resource = {
      status: {},
    };
    result = knativeMapper.routeToAppRoute(resource);
    expect(result).toBeDefined();
    expect(result.trafficTargets).toBeDefined();
    expect(Object.keys(result.trafficTargets).length).toEqual(0);
    expect(result.routingTags).toBeDefined();
    expect(Object.keys(result.routingTags).length).toEqual(0);

    resource = {
      status: {
        traffic: {}
      },
    };
    result = knativeMapper.routeToAppRoute(resource);
    expect(result).toBeDefined();
    expect(result.trafficTargets).toBeDefined();
    expect(Object.keys(result.trafficTargets).length).toEqual(0);
    expect(result.routingTags).toBeDefined();
    expect(Object.keys(result.routingTags).length).toEqual(0);

    resource = {
      status: {
        traffic: [],
      },
    };
    result = knativeMapper.routeToAppRoute(resource);
    expect(result).toBeDefined();
    expect(result.trafficTargets).toBeDefined();
    expect(Object.keys(result.trafficTargets).length).toEqual(0);
    expect(result.routingTags).toBeDefined();
    expect(Object.keys(result.routingTags).length).toEqual(0);

    resource = {
      status: {
        traffic: [ {
          foo: 'bar',
        }],
      },
    };
    result = knativeMapper.routeToAppRoute(resource);
    expect(result).toBeDefined();
    expect(result.trafficTargets).toBeDefined();
    expect(Object.keys(result.trafficTargets).length).toEqual(0);
    expect(result.routingTags).toBeDefined();
    expect(Object.keys(result.routingTags).length).toEqual(0);

    resource = {
      status: {
        traffic: [ {
          revisionName: 'foo-bar',
        }],
      },
    };
    result = knativeMapper.routeToAppRoute(resource);
    expect(result).toBeDefined();
    expect(result.trafficTargets).toBeDefined();
    expect(Object.keys(result.trafficTargets).length).toEqual(1);
    expect(result.trafficTargets['foo-bar']).toEqual(0);
    expect(result.routingTags).toBeDefined();
    expect(Object.keys(result.routingTags).length).toEqual(1);
    expect(result.routingTags['foo-bar'].length).toEqual(0);
  });

  it('converts an application to a knative service', () => {
    // read the knative revisions from file
    let app: appModel.IUIApplication = {
      id: 'some-id',
      kind: commonModel.UIEntityKinds.APPLICATION,
      name: 'foo',
      namespace: 'bar',
      regionId: 'us-south',
      template: {},
    };

    let result: knativeModel.IKnativeService = knativeMapper.applicationToService(app);
    expect(result).toBeDefined();
    expect(result.kind).toEqual('Service');
    expect(result.metadata).toBeDefined();
    expect(result.metadata.name).toEqual(app.name);
    expect(result.metadata.namespace).toBeUndefined();

    expect(result.spec).toBeDefined();
    expect(result.spec.template).toBeDefined();
    expect(result.spec.template.spec).toBeDefined();
    expect(result.spec.template.spec.timeoutSeconds).toBeUndefined();
    expect(result.spec.template.spec.containerConcurrency).toBeUndefined();
    expect(result.spec.template.spec.containers).toBeDefined();
    expect(result.spec.template.spec.containers[0]).toBeDefined();
    expect(result.spec.template.spec.containers[0].image).toBeUndefined();
    expect(result.spec.template.spec.containers[0].resources).toBeDefined();
    expect(result.spec.template.spec.containers[0].resources.limits).toBeDefined();
    expect(result.spec.template.spec.containers[0].resources.limits.cpu).toBeUndefined();
    expect(result.spec.template.spec.containers[0].resources.limits.memory).toBeUndefined();
    expect(result.spec.template.spec.containers[0].resources.requests).toBeDefined();
    expect(result.spec.template.spec.containers[0].resources.requests.cpu).toBeUndefined();
    expect(result.spec.template.spec.containers[0].resources.requests.memory).toBeUndefined();

    expect(result.spec.template.metadata).toBeDefined();
    expect(result.spec.template.metadata.annotations).toBeDefined();
    expect(result.spec.template.metadata.annotations['autoscaling.knative.dev/minScale']).toBeUndefined();
    expect(result.spec.template.metadata.annotations['autoscaling.knative.dev/maxScale']).toBeUndefined();

    app = {
      id: 'some-id',
      kind: commonModel.UIEntityKinds.APPLICATION,
      name: 'foo',
      namespace: 'bar',
      regionId: 'us-south',
      template: {
        cpus: 0.1,
        image: 'ibmcom/kn-helloworld',
        maxScale: 3,
        memory: 2345678,
        minScale: 0,
        timeoutSeconds: 200,
        containerConcurrency: 10,
      }
    };

    result = knativeMapper.applicationToService(app);
    expect(result).toBeDefined();
    expect(result.kind).toEqual('Service');
    expect(result.metadata).toBeDefined();
    expect(result.metadata.name).toEqual(app.name);
    expect(result.metadata.namespace).toBeUndefined();

    expect(result.spec).toBeDefined();
    expect(result.spec.template).toBeDefined();
    expect(result.spec.template.spec).toBeDefined();
    expect(result.spec.template.spec.timeoutSeconds).toEqual(200);
    expect(result.spec.template.spec.containerConcurrency).toEqual(10);
    expect(result.spec.template.spec.containers).toBeDefined();
    expect(result.spec.template.spec.containers[0]).toBeDefined();
    expect(result.spec.template.spec.containers[0].image).toEqual('ibmcom/kn-helloworld');
    expect(result.spec.template.spec.containers[0].resources).toBeDefined();
    expect(result.spec.template.spec.containers[0].resources.limits).toBeDefined();
    expect(result.spec.template.spec.containers[0].resources.limits.cpu).toEqual('0.1');
    expect(result.spec.template.spec.containers[0].resources.limits.memory).toEqual('2345678');
    expect(result.spec.template.spec.containers[0].resources.requests).toBeDefined();
    expect(result.spec.template.spec.containers[0].resources.requests.cpu).toEqual('0.1');
    expect(result.spec.template.spec.containers[0].resources.requests.memory).toEqual('2345678');

    expect(result.spec.template.metadata).toBeDefined();
    expect(result.spec.template.metadata.annotations).toBeDefined();
    expect(result.spec.template.metadata.annotations['autoscaling.knative.dev/minScale']).toEqual('0');
    expect(result.spec.template.metadata.annotations['autoscaling.knative.dev/maxScale']).toEqual('3');
  });
});
