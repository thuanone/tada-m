# Coligo UI

[![Build Status](https://travis.ibm.com/coligo/ui.svg?token=UJLHzMsjz9idyvaxDy2e&branch=master)](https://travis.ibm.com/coligo/ui)

The IBM Cloud console plugin for the IBM Coligo UI service

## About

The Coligo ui is a web application that runs as a node / express app and is written using ES6 and React.

This project contains the code for the IBM Coligo UI that runs in the IBM Cloud console under https://dev.console.cloud.ibm.com/codeengine.

## Table of Contents

- [Developing](#developing)
- [Deploying](#deploying)
- [Logs](#logs)
- [Working behind the console proxy](#working-behind-the-console-proxy)
- [End-to-end testing with nightwatch](#end-to-end-testing-with-nightwatch)

## Developing

Make sure you have the following installed on your system:

- node: 12.*
- npm: 6.*

There are several sensitive environment variables required to run the app. These are currently expected to be set in a file located at `~/.coligo.secrets.sh` which will get called during application startup. This file should set values for the following variables. Contact @sandrarapp (sandrarapp@de.ibm.com) to get this information.

```
export iamClientId='<PRIVATE DATA>'
export iamClientSecret='<PRIVATE DATA>'
export uaaClientId='<PRIVATE DATA>'
export uaaClientSecret='<PRIVATE DATA>'
export LAUNCH_DARKLY_SDK_KEY='<PRIVATE DATA>'
// For running the nightwatch e2e tests
export CONSOLE_USER='<PRIVATE DATA>'
export CONSOLE_PASSWORD='<PRIVATE DATA>'
```

After cloning the repo, cd to the project root and run `npm install` to install dependencies.

In order to avoid that secrets accidentially finding their way into our repo, we use the [Detect Secrets Developer Tool](https://w3.ibm.com/w3publisher/detect-secrets/developer-tool) in combination with a pre-commit hook. After setting up `detect-secrets` and `pre-commit`, you'll need to execute the following command to setup the pre-commit hooks on in your local repository clone:

```
pre-commit install
```


Then run the following commands to get the app up and running locally. You will probably want to run these in separate consoles.

```
npm run build:dev   // kicks the build (ts -> js) transpilation
# open a second console tab
npm run proxy:start // start the local reverse proxy and Redis
npm run start:dev   // start the coligo ui app in dev mode
```

Alternatively you can run all three tasks in parallel in the same console using `npm run dev`, but it's probably not as practical for development.

**NOTE** The local development setup can be targeted to both stage IAM and production IAM. Per default it uses the production IAM. You can change that by exporting the environment varibale `IAM` in your shell, prior starting the app: `export IAM=stage`.

**NOTE:** Navigate to [How to Install the Local Dev Proxy](https://github.ibm.com/Bluemix/local-dev-proxy#how-to-install-the-local-dev-proxy) and follow the Setup Requirement and Setup Steps. If you used an old version of dev-proxy (which required a sudo password), make sure to uninstall it beforehand `sudo npm uninstall -g @console/local-dev-proxy`

**NOTE** The app is built and served differently depending on whether or not it's a development or production build, and it's important to test out both versions of the app so you hit any production specific issues locally. After making your code changes and before submitting a PR just do a quick sanity test using a production build to make sure nothing unexpected pops up. To do this run `npm run start:prod` and then point your browser to `http://localhost:3000`. The main difference for production is that the code bundles are far more optimized and several external dependencies are loaded separately.

**NOTE** Make sure that all packages required at runtime are included as dependencies (not devDependencies), and that all versions of the dependencies are locked down. We do not want to automatically pick up any updates during the build. We need to make sure any package updates are done intentionally and are verified before going to production. Also remember to use the `npm run opensource` task to keep our OPENSOURCE file up to date when we update any dependencies.

## Deploying

All changes should almost always be merged to master first. The exception to this is when a CIE is being worked and we need to push in a fix quickly. Then the fix should be merged directly to v1.0 and a PR submitted to master immediately afterwards. As changes are merged into master they are automatically deployed to [devtest](https://dev.console.test.cloud.ibm.com) and [devprod](https://dev.console.cloud.ibm.com). These changes should be verified in devprod and then it's safe to merge them into v1.0, which is deployed to [test-ondeck](https://ondeck.console.test.cloud.ibm.com) and [prod-ondeck](https://ondeck.console.cloud.ibm.com) environments. Changes should be verified manually, and the e2e tests should also be run from your local system against the relevant console before moving forward. The e2e tests running automatically in the pipeline is a basic set of sanity tests to make sure things aren't completely broken.

Build and deployment progress can be monitored from the #bld-knative channel in slack, and in [jenkins](https://wcp-console-jenkins.swg-devops.com/blue/organizations/jenkins/pipelines?search=knative). To get access to the jenkins builds, submit a [USAM request](https://usam.svl.ibm.com:9443/AM) for system `CLOUD-CONSOLE` and group `Jenkins Build Server/Developer Access`.

Deployment to [test](https://test.cloud.ibm.com) and [production](https://cloud.ibm.com) environments is a manual operation. Use the [Ondeck-promote jenkins job](https://wcp-console-jenkins.swg-devops.com/blue/organizations/jenkins/promote%2Fknative/activity) to promote the builds currently deployed to the ondeck consoles.

The current coligo-ui build being served in any given environment can be found at `/healthcheck/v1/versions`, for example in production at [https://cloud.ibm.com/healthcheck/v1/versions](https://cloud.ibm.com/healthcheck/v1/versions).

## Logs

All logs are accessible in LogDNA and can be accessed via the [Logging](https://cloud.ibm.com/observe/logging) page in the associated console. For dev and test, use the `1308775 - Core Test` account to access the logs. For production, use the `1390033 - IBM` account.

## Working behind the console proxy

The context root of the Coligo UI microservice is currently the same as the path it's served from on the console ingress. This means no re-writing of requests, and it also means we don't really need to worry about the "internal" path (path on ingress) being different from the "external" path (path on console proxy). However, we should keep in mind that this could always change. This means all server side routing should be relative to our configured `contextRoot`, e.g. the apis should be served at `${contextRoot}api` and javascript should be served relative to `${contextRoot}js`. When calling back to the server from the client we need to take into account we are behind the console proxy, so that means calling URLs relative to our configured `proxyRoot`. For example, to access the apis from the client you would call `${window.armada.config.proxyRoot}api/` and images would be accessed at `${window.armada.config.proxyRoot}img`.

## End-to-end testing with nightwatch

End-to-end tests are written using [nightwatch](http://nightwatchjs.org/api).

Tests are located under `test/nightwatch`. The `run.js` file is the starting point for the e2e tests and the `nightwatch.json` file contains the configuration for running the tests. The `specs` folder contains the individual test modules which are mixed into the single test suite when the tests are run.

To run the e2e tests locally, set the CONSOLE_USER and CONSOLE_PASSWORD (and optionally E2E_TEST_ACCOUNT) env vars in your `~/.coligo.secrets.sh` file and then use one of the `npm run nightwatch:<env>` tasks. You will only need to set the account if for example you want to use your own user to run the tests. For example to run tests against prod-ondeck use `npm run nightwatch:prod-ondeck`. To run the e2e tests against your local dev environment make sure you have your dev environment running and then use `npm run nightwatch`.

The `INT_TEST_FILTER` env var can be used to specify which tests to run. This is a comma separated list of spec file names without the `.js` extension. This allows running only specific tests so you don't have to sit through all the others.
```
INT_TEST_FILTER=clusterConfig npm run nightwatch
```
