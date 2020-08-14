// import config from "../../../config/app.json";

const config = {
  cfDomain: 'something.stage1.cloud.ibm.com',
  coligoUsabillaDisabled: 'false',
  contextRoot: '/codeengine/',
  docs: {
    foo: 'bar',
  },
  proxyRoot: '/codeengine/',
};

export function get(key?) {
    if (!key || key === 'config') { return config; }
    const tokens = key.split(':');
    let index = 0;
    let value = config;
    while (index < tokens.length) {
      value = value[tokens[index]];
      index++;
    }
    return value;
}

export function env() {
  // do something
}

export function file(some: string, thing?: string) {
  // do something
}
