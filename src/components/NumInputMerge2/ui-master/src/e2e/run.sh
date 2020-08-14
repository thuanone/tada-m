#!/bin/bash
source ~/.coligo.secrets.sh
./node_modules/.bin/nightwatch --suiteRetries 3 -e $1 -t run.js
