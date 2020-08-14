/**
 * IBM Confidential
 * Licensed Materials - Property of IBM
 * IBM Cloud Container Service, 5737-D43
 * (C) Copyright IBM Corp. 2018 All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */

import * as launchdarkly from '../services/launchdarkly-service';

const getFlag = (req, res) => {

  const flag = req.query.flag;
  if (flag && flag.indexOf(',') > -1) {
    launchdarkly.getFlag(req, flag.split(','), (value) => {
      res.json({ value });
    });
  } else {
    launchdarkly.getFlag(req, flag, (value) => {
      res.json({ value });
    });
  }
};

module.exports = {
  getFlag,
};
