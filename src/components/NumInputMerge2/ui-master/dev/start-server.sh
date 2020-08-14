#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR/..
export VCAP_SERVICES='{ "user-provided": [{ "name": "Redis_Compose", "label": "user-provided", "credentials": { "port": "6379", "host": "localhost" } }] }'
export resiliencyCacheName='Redis_Compose'
export resiliencyCacheType='REDIS'
export bluemixHost='stage1.ng.bluemix.net'
export uaaCallbackUrl='https://dev.console.test.cloud.ibm.com/login/callback'
export contextRoot='/codeengine/'
export iamGlobalUrl='https://iam.test.cloud.ibm.com'
export resourceControllerUrl='https://resource-controller.test.cloud.ibm.com'
export aceAnalyticsRoute='https://dev.console.test.cloud.ibm.com/common'
export aceCommonRoute='https://dev.console.test.cloud.ibm.com/analytics'


export LOG4JS_LEVEL='DEBUG'

# the environment should default to the stage IAM environment, because all dev and test backend reside in stage-IAM-land
export IAM='stage'
# export CRN='knative'
export CRN='codeengine'

source ~/.coligo.secrets.sh

# disable the structured logger
export coligoLoggerDisabled='true'

if [ "$IAM" = "stage" ]
then
  echo "Preparing the STAGE environment  ..."
  if [ "$CRN" = "knative" ]
  then
    echo "Point to Coligo endpoints  ..."
    export coligoEnvironments='{ "au-syd": "api.dev-serving.knative.dev.cloud.ibm.com", "eu-de": "api.test.knative.dev.cloud.ibm.com", "us-south": "api.us-south.knative.test.cloud.ibm.com", "jp-tok": "api.dev-src2image.knative.dev.cloud.ibm.com" }'
    export coligoResourcePlanId='d0cc9165-0ca4-417a-a331-3a22d4e41ea0'
    export coligoResourceId='506082a0-0c84-11ea-a0a5-f195be0f84da'
  else
    echo "Point to Code Engine endpoints  ..."
    export coligoEnvironments='{ "au-syd": "api.dev-serving.codeengine.dev.cloud.ibm.com", "eu-de": "api.test.codeengine.dev.cloud.ibm.com", "us-south": "api.us-south.codeengine.test.cloud.ibm.com", "jp-tok": "api.dev-src2image.codeengine.dev.cloud.ibm.com" }'
    export coligoResourcePlanId='814fb158-af9c-4d3c-a06b-c7da42392845'
    export coligoResourceId='2ad2fdd0-bba5-11ea-8966-5d6402fed1c7'
  fi
else
  echo "Preparing the PROD environment  ..."
  source $DIR/extract-local-IAM-token.sh
  export resourceControllerUrl='https://resource-controller.cloud.ibm.com'
  if [ "$CRN" = "knative" ]
  then
    echo "Point to Coligo endpoints  ..."
    export coligoEnvironments='{ "us-south": "api.us-south.knative.cloud.ibm.com" }'
    export coligoResourcePlanId='d0cc9165-0ca4-417a-a331-3a22d4e41ea0'
    export coligoResourceId='506082a0-0c84-11ea-a0a5-f195be0f84da'
  else
    echo "Point to Code Engine endpoints  ..."
    export coligoEnvironments='{ "us-south": "api.us-south.codeengine.cloud.ibm.com" }'
    export coligoResourcePlanId='814fb158-af9c-4d3c-a06b-c7da42392845'
    export coligoResourceId='2ad2fdd0-bba5-11ea-8966-5d6402fed1c7'
  fi
fi

if [ "$NODE_ENV" = "development" ]
then
  echo "Starting the node server in a watch mode ..."
  ./node_modules/.bin/nodemon --watch dist/server/ts dist/server/ts/app.js
else
  echo "Starting the node server ..."
  node dist/server/ts/app.js
fi
