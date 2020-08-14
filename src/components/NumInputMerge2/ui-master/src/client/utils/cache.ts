// 3rd-party
import * as log from 'loglevel';

import utils from '../api/utils';
import * as appModel from './../../common/model/application-model';
import * as buildModel from './../../common/model/build-model';
import { IUIRequestResult, UIEntityStatus } from './../../common/model/common-model';
import * as jobModel from './../../common/model/job-model';
import * as projectModel from './../../common/model/project-model';
import win from './window';

const COMPONENT = 'utils:cache';
const logger = log.getLogger(COMPONENT);

const config = window.armada.config;
let cache = {};
let listeners = [];

interface IListener {
  keyName: string;
  callback: () => any;
  errback: (err) => any;
  removed?: boolean;
}

interface IKey {
  aborting?: boolean;
  getNextInterval?: (oldData: any, newData: any, defaultInterval: number, lastInterval: number) => number;
  defaultInterval: number;
  inflight?: {
    abort: () => any;
  };
  interval?: number;
  timeout?: () => any;
  formatter?: (data) => any;
  name: string;
  url: (id: string) => string;
}

const keys: IKey[] = [{
  defaultInterval: 1000 * 60,
  formatter: (data) => {
    return data.payload;
  },
  name: 'coligo-components',
  // id format: "region/${regionId}/project/:${projectId}"
  url: (id) => `${config.proxyRoot}api/core/v1/${id}/components`
}, {
  defaultInterval: 1000 * 60,
  formatter: (data: IUIRequestResult) => {
    return data.payload;
  },
  name: 'coligo-jobdefinitions',
  url: (id) => `${config.proxyRoot}api/core/v1/${id}/jobdefinitions`,
}, {
  defaultInterval: 1000 * 60,
  formatter: (data: IUIRequestResult) => {
    return data.payload;
  },
  name: 'coligo-jobdefinition',
  url: (id) => `${config.proxyRoot}api/core/v1/${id}`,
}, {
  defaultInterval: 1000 * 60,
  formatter: (data) => {
    return data.payload;
  },
  getNextInterval: (oldData: jobModel.IUIJobRun, newData: jobModel.IUIJobRun, defaultInterval: number, lastInterval: number): number => {
    const stateIsSettled = (status: string) => (
      status === jobModel.UIJobStatus.SUCCEEDED || status === jobModel.UIJobStatus.FAILED
    );

    if (!stateIsSettled(newData.status)) {
      return 3000;
    }
  },
  name: 'coligo-job-run',
  // id format: "region/${regionId}/project/:${projectId}/job/${jobrunId}"
  url: (id) => `${config.proxyRoot}api/core/v1/${id}`
}, {
  defaultInterval: 1000 * 60,
  formatter: (data) => {
    return data.payload;
  },
  name: 'coligo-job-runs',
  // id format: "region/${regionId}/project/:${projectId}"
  url: (id) => `${config.proxyRoot}api/core/v1/${id}/jobs`
}, {
  defaultInterval: 1000 * 60,
  formatter: (data) => {
    return data.payload;
  },
  name: 'coligo-job-runs-for-job-def',
  // id format: "region/${regionId}/project/:${projectId}/jobs?jobDefinitionName=myJobDefinition"
  url: (id) => `${config.proxyRoot}api/core/v1/${id}`
}, {
  defaultInterval: 1000 * 60,
  formatter: (data) => {
    return data.payload;
  },
  name: 'coligo-builds',
  // id format: "region/${regionId}/project/:${projectId}"
  url: (id) => `${config.proxyRoot}api/core/v1/${id}/builds`
}, {
  defaultInterval: 1000 * 60,
  formatter: (data) => {
    return data.payload;
  },
  name: 'coligo-buildruns',
  // id format: "region/${regionId}/project/:${projectId}"
  url: (id) => `${config.proxyRoot}api/core/v1/${id}/buildruns`
}, {
  defaultInterval: 1000 * 60,
  formatter: (data: IUIRequestResult) => {
    return data.payload;
  },
  name: 'coligo-build',
  url: (id) => `${config.proxyRoot}api/core/v1/${id}`,
}, {
  defaultInterval: 1000 * 60,
  formatter: (data) => {
    return data.payload;
  },
  getNextInterval: (oldData: buildModel.IUIBuildRun[], newData: buildModel.IUIBuildRun[], defaultInterval: number, lastInterval: number): number => {
    const stepSize = 10000; // 10seconds
    if (!newData || !oldData) {
      return stepSize;
    }

    let isChanging = false;
    // check whether one of the project resources is not in state ready
    for (const buildRun of newData) {
      if (buildRun.status === buildModel.UIBuildRunStatus.RUNNING || buildRun.status === buildModel.UIBuildRunStatus.PENDING) {
        isChanging = true;
        break;
      }
    }

    // in case one of the build runs is running or waiting, we'll reset the poll interval
    if (isChanging) {
      return stepSize;
    }

    // if the number of buildruns changed, reset the poll interval
    if (oldData.length !== newData.length) {
      return stepSize;
    }

    // if the number of buildruns did not change, increase the poll interval
    if (oldData.length === newData.length && lastInterval < defaultInterval) {
      return lastInterval + stepSize;
    }

    return defaultInterval;
  },
  name: 'coligo-buildruns',
  // id format: "region/${regionId}/project/:${projectId}"
  url: (id) => `${config.proxyRoot}api/core/v1/${id}`
}, {
  defaultInterval: 1000 * 60,
  formatter: (data) => {
    return data.payload;
  },
  name: 'coligo-registries',
  // id format: "region/${regionId}/project/:${projectId}"
  url: (id) => `${config.proxyRoot}api/core/v1/${id}/secrets?secretType=registry`
}, {
  defaultInterval: 1000 * 60,
  formatter: (data) => {
    return data.payload;
  },
  name: 'coligo-generic-secrets',
  // id format: "region/${regionId}/project/:${projectId}"
  url: (id) => `${config.proxyRoot}api/core/v1/${id}/secrets?secretType=generic`
}, {
  defaultInterval: 1000 * 60,
  formatter: (data) => {
    return data.payload;
  },
  name: 'coligo-configmaps',
  // id format: "region/${regionId}/project/:${projectId}"
  url: (id) => `${config.proxyRoot}api/core/v1/${id}/confmaps`
}, {
  defaultInterval: 1000 * 60,
  formatter: (data) => {
    return data.payload;
  },
  name: 'coligo-project-configs',
  // id format: "region/${regionId}/project/:${projectId}"
  url: (id) => `${config.proxyRoot}api/core/v1/${id}/configitems`
}, {
  defaultInterval: 1000 * 60,
  formatter: (data) => {
    return data.payload;
  },
  name: 'coligo-project',
  // id format: "region/${regionId}/project/:${projectId}"
  url: (id) => `${config.proxyRoot}api/core/v1/${id}`,
}, {
  defaultInterval: 1000 * 15,
  formatter: (data) => {
    return data.payload;
  },
  name: 'coligo-project-status',
  // id format: "region/${regionId}/project/:${projectId}"
  url: (id) => `${config.proxyRoot}api/core/v1/${id}/status`,
}, {
  defaultInterval: 1000 * 20,
  formatter: (data: IUIRequestResult) => {
    return data.payload;
  },
  name: 'coligo-project-consumption',
  url: (id) => `${config.proxyRoot}api/core/v1/${id}/consumption`,
}, {
  defaultInterval: 1000 * 60,
  formatter: (data: IUIRequestResult) => {
    return data.payload;
  },
  name: 'coligo-applications',
  url: (id) => `${config.proxyRoot}api/core/v1/${id}/applications`,
}, {
  defaultInterval: 1000 * 30,
  formatter: (data: IUIRequestResult) => {
    return data.payload;
  },
  getNextInterval: (oldData: appModel.IUIApplication, newData: appModel.IUIApplication, defaultInterval: number, lastInterval: number): number => {
    const stateIsSettled = (status: string) => (
      status === UIEntityStatus.READY || status === UIEntityStatus.FAILED
    );

    // there are cases where it was not possible to load a revision (e.g. right after the app has been created)
    // in those situations we are reloading the app until all data could be fetched properly!
    if (!newData.revision) {
      return 1000;
    }

    if (!stateIsSettled(newData.status)) {
      return 3000;
    }
  },
  name: 'coligo-application',
  url: (id) => `${config.proxyRoot}api/core/v1/${id}`,
}, {
  defaultInterval: 1000 * 20,
  formatter: (data: IUIRequestResult) => {
    return data.payload;
  },
  getNextInterval: (oldData: appModel.IUIApplicationInstance[], newData: appModel.IUIApplicationInstance[], defaultInterval: number, lastInterval: number): number => {
    const stepSize = 2000; // 2seconds
    if (!newData || !oldData) {
      return stepSize;
    }

    let isChanging = false;
    // check whether one of the instances is not in state ready
    for (const instance of newData) {
      if (instance.statusPhase !== 'Running') {
        isChanging = true;
        break;
      }
    }

    // in case one of the pods is about to change from or into phase Running, we'll reset the poll interval
    if (isChanging) {
      return stepSize;
    }

    // if the number of instances changed, reset the poll interval
    if (oldData.length !== newData.length) {
      return stepSize;
    }

    // if the number of instances did not change, increase the poll interval
    if (oldData.length === newData.length && lastInterval < defaultInterval) {
      return lastInterval + stepSize;
    }

    return defaultInterval;
  },
  name: 'coligo-application-instances',
  url: (id) => `${config.proxyRoot}api/core/v1/${id}/instances`,
}, {
  defaultInterval: 1000 * 30,
  formatter: (data: IUIRequestResult) => {
    return data.payload;
  },
  name: 'coligo-application-revisions',
  url: (id) => `${config.proxyRoot}api/core/v1/${id}/revisions`,
}, {
  defaultInterval: 1000 * 30,
  formatter: (data: IUIRequestResult) => {
    return data.payload;
  },
  name: 'coligo-application-route',
  url: (id) => `${config.proxyRoot}api/core/v1/${id}/route`,
}, {
  defaultInterval: 1000 * 60,
  formatter: (data: IUIRequestResult) => {
    return data.payload;
  },
  getNextInterval: (oldData: projectModel.IUIProject[], newData: projectModel.IUIProject[], defaultInterval: number, lastInterval: number): number => {
    const stepSize = 5000; // 5seconds
    if (!newData || !oldData) {
      return stepSize;
    }

    let isChanging = false;
    // check whether one of the project resources is not in state ready
    for (const projectResource of newData) {
      if (projectResource.state !== projectModel.UIResourceInstanceStatus.ACTIVE) {
        isChanging = true;
        break;
      }
    }

    // in case one of the projects is about to change from or into phase ACTIVE, we'll reset the poll interval
    if (isChanging) {
      return stepSize;
    }

    // if the number of projects changed, reset the poll interval
    if (oldData.length !== newData.length) {
      return stepSize;
    }

    // if the number of projects did not change, increase the poll interval
    if (oldData.length === newData.length && lastInterval < defaultInterval) {
      return lastInterval + stepSize;
    }

    return defaultInterval;
  },
  name: 'coligo-projects',
  url: () => `${config.proxyRoot}api/core/v1/region/all/projects`,
}, {
  defaultInterval: 1000 * 60,
  formatter: (data: IUIRequestResult) => {
    return data.payload;
  },
  name: 'resource-groups',
  url: () => `${config.proxyRoot}api/core/v1/resource-groups`,
}, {
  defaultInterval: 1000 * 60,
  formatter: (data: IUIRequestResult) => {
    return data.payload;
  },
  name: 'coligo-regions',
  url: () => `${config.proxyRoot}api/core/v1/regions`,
}, {
  defaultInterval: 1000 * 60,
  formatter: (data: IUIRequestResult) => {
    return data.payload;
  },
  name: 'coligo-performance-monitors',
  url: () => `${config.proxyRoot}api/health/v1/performance/monitors`,
}, {
  defaultInterval: 1000 * 60,
  formatter: (data: IUIRequestResult) => {
    return data.payload;
  },
  name: 'coligo-cache-statistics',
  url: () => `${config.proxyRoot}api/health/v1/cache/stats`,
}, {
  defaultInterval: 1000 * 60,
  formatter: (data: IUIRequestResult) => {
    return data.payload;
  },
  name: 'coligo-health-status',
  url: () => `${config.proxyRoot}api/health/v1/status`,
},
{
  defaultInterval: 1000 * 60,
  formatter: (data: IUIRequestResult) => {
    return data.payload;
  },
  name: 'coligo-app-configuration',
  url: () => `${config.proxyRoot}api/health/v1/configuration`,
}
];

const hasListeners = (keyName) => listeners.some((l) => l.keyName === keyName);

const listen = (keyName, callback, errback) => {
  const listener: IListener = { keyName, callback, errback };
  listeners.push(listener);
  return () => {
    // We need to account for the case where a single cache update notifies multiple listeners,
    // and one of those listener callbacks removes another listener for the same cache. That means
    // the array of listeners we're notifying might have some that are no longer valid. So we set
    // the removed flag when it gets removed so we can key off that to know whether or not it's
    // still valid.
    listener.removed = true;
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      // If no listeners exist for the key name then stop refreshing
      if (!hasListeners(keyName)) {
        const key = keys.find((k) => k.name === keyName);
        if (key && key.inflight) {
          key.inflight.abort();
        }
        if (key && key.timeout) {
          key.timeout();
        }
        if (cache[keyName]) {
          delete cache[keyName];
        }
      }
    }
  };
};

const get = (keyName) => cache[keyName];

const put = (keyName, data, abortInflight?: boolean) => {
  cache[keyName] = data;
  listeners.filter((l) => l.keyName === keyName).forEach((listener) => {
    // Always make sure the listener hasn't been removed by a previous listener callback
    if (!listener.removed) {
      listener.callback(data);
    }
  });
  if (abortInflight) {
    const key = keys.find((k) => k.name === keyName);
    if (key && key.inflight) {
      key.aborting = true;
      key.inflight.abort();
      delete key.aborting;
      delete key.inflight;
    }
  }
};

const refresh = (id, key: IKey) => {
  const fn = `refresh - '${key.name}/${id}' `;
  logger.debug(`${fn}>`);
  const k = key;
  // Do not bother with a refresh if no one is listening
  if (!hasListeners(k.name)) {
    logger.debug(`${fn}< id: '${id}' null - has no listeners`);
    return null;
  }
  // If there is already a request in progress abort it, since the new request might have
  // different context
  if (k.inflight) {
    k.aborting = true;
    k.inflight.abort();
    delete k.aborting;
  }
  if (k.timeout) {
    k.timeout();
  }
  const urlToUseForRefresh = typeof k.url === 'function' ? k.url(id) : k.url;
  k.inflight = utils.doGet({
    bypass_inmemory_cache: true,
    url: urlToUseForRefresh,
  }).done((data) => {
    logger.debug(`${fn}< DONE`);
    const formattedData = k.formatter ? k.formatter(data) : data;

    // calculate the next poll interval
    if (k.getNextInterval) {
      k.interval = k.getNextInterval(get(k.name), formattedData, k.defaultInterval, k.interval);
    }

    // if the next interval has not been set,
    // or is an invsalid value, use the default instead
    if (!k.interval || k.interval <= 0) {
      k.interval = k.defaultInterval;
    }

    put(k.name, formattedData);
  }).fail((xhr /* , status, error */) => {
    logger.debug(`${fn}< FAILED`);
    if (!key.aborting) {
      listeners.filter((l) => l.keyName === k.name && !!l.errback).forEach((l) => {
        // Always make sure the listener hasn't been removed by a previous listener errback
        if (!l.removed) {

          // transform the jqXhr error response into a known UIRequestError
          const requestError = utils.transformErrorResponse(xhr);
          l.errback(requestError);
        }
      });
    }
  }).always(() => {
    delete k.inflight;
    // If the first thing we got was an error then don't refresh
    if (cache[k.name]) {
      k.timeout = win.timeout(refresh.bind(this, id, k), k.interval);
    }
  });
  return k.inflight;
};

const update = (id, keyNames) => {
  logger.debug(`update - id: '${id}', keyNames: '${JSON.stringify(keyNames)}'`);
  const names = Array.isArray(keyNames) ? keyNames : [keyNames];
  keys.filter((k) => names.indexOf(k.name) > -1).forEach((k) => {
    refresh(id, k);
  });
};

const reset = () => {
  cache = {};
  listeners = [];
};

export default { get, put, reset, listen, update };
