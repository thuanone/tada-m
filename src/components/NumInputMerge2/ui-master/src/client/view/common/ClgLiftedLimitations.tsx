import React, { Component } from 'react';
import GlobalStateContext from './GlobalStateContext';
import flagsApi from '../../api/flags';
import * as brokerApi from '../../api/broker-api';

import * as log from 'loglevel';

export class ClgLiftedLimitations extends Component {
  private readonly COMPONENT = 'ClgLiftedLimitations';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  constructor(props) {
    super(props);
  }

  public componentWillMount() {
    // only make calls if the value in the context is empty
    if (this.context && this.context.liftedProjectLimitations === undefined) {
      // check for feature flag first
      this.getLiftedLimitationsFeatureFlag();
    }
  }

  public render() {
    return (
      <></>
    );
  }

  /** Get feature flag for the lifted limitations feature */
  public getLiftedLimitationsFeatureFlag() {
    const fn = 'getLiftedLimitationsFeatureFlag ';
    // flagsApi.getFlag(flagsApi.flags.FEATURE_LIFTED_LIMITATIONS, (flag) => {
    // TODO: replace alpha flag with real flag
    flagsApi.getFlag('coligo-ui-features-alpha', (flag) => {
      this.logger.debug(`${fn}- evaluated feature flag '${JSON.stringify(flag)}'`);
      if (flag && flag.value === true) {
        // only make a call to the broker if the feature flag is enabled
        this.getLiftedLimitationsFromBrokerAPI();
      }
    });
  }

  /** Get lifted limitations boolean from the broker API */
  public getLiftedLimitationsFromBrokerAPI() {
    const fn = 'getLiftedLimitationsFromBrokerAPI ';
    // TODO: check lift limitations per region when broker API is exposed and real service has to be implemented
    brokerApi.getLiftedLimitations('us-south').then((value) => {
      this.logger.debug(`${fn}- fetched lifted limitations '${JSON.stringify(value)}'`);
      // set to the context
      this.setLiftedLimitationsToContext(value);
    }).catch((err) => {
      // FIXME
    });
  }

  public setLiftedLimitationsToContext(value) {
    this.context.onUpdateState('liftedProjectLimitations', value);
  }

}
// consume the GlobalStateContext
ClgLiftedLimitations.contextType = GlobalStateContext;

export default ClgLiftedLimitations;
