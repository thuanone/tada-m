#!/bin/bash

# USAGE: . ./extract-local-IAM-token.sh
# USAGE: source ./extract-local-IAM-token.sh

WORKAROUND_IAM_ACCESS_TOKEN=`ibmcloud iam oauth-tokens|grep -o "eyJraW.*"`
WORKAROUND_IAM_REFRESH_TOKEN=`cat ~/.bluemix/config.json|grep IAMRefreshToken|grep -o "OK[^\"]*"`
WORKAROUND_IAM_ACCOUNT_GUID=`cat ~/.bluemix/config.json|grep GUID|grep -o "\"[0-9a-z^\"]*\"" | head -1`

# remove the leading and the trailing quotes
WORKAROUND_IAM_ACCOUNT_ID=${WORKAROUND_IAM_ACCOUNT_GUID#"\""}
WORKAROUND_IAM_ACCOUNT_ID=${WORKAROUND_IAM_ACCOUNT_ID%"\""}

echo
echo "Extracted IAM tokens from ~/.bluemix/config.json:"
echo "    access_token: '$WORKAROUND_IAM_ACCESS_TOKEN'"
echo "    refresh_token: '${WORKAROUND_IAM_REFRESH_TOKEN##*\"}'"
echo "    account_id: '$WORKAROUND_IAM_ACCOUNT_ID'"
echo

export WORKAROUND_IAM_ACCESS_TOKEN=$WORKAROUND_IAM_ACCESS_TOKEN
export WORKAROUND_IAM_REFRESH_TOKEN=${WORKAROUND_IAM_REFRESH_TOKEN##*\"}
export WORKAROUND_IAM_ACCOUNT_GUID=$WORKAROUND_IAM_ACCOUNT_ID

echo
