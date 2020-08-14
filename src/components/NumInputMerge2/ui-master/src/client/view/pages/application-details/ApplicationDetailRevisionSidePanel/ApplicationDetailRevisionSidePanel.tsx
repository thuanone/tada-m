// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { CheckmarkFilled16, ChevronDown16, ChevronRight16, ErrorFilled16, Hourglass16, InformationFilled16, } from '@carbon/icons-react';
import { FormItem, FormLabel, } from '@console/pal/carbon-components-react';
import { getLocale } from '@console/pal/Utilities';

// coligo
import * as appModel from '../../../../../common/model/application-model';
import { IUIEnvItems, UIEntityStatus } from '../../../../../common/model/common-model';
import * as memoryUtils from '../../../../../common/utils/memory-utils';
import * as dateUtils from '../../../../utils/date';
import clgAppStatus from '../../../../utils/formatter/clgAppStatus';
import t from '../../../../utils/i18n';
import clgEnvName from '../../../../utils/formatter/clgEnvName';
import clgEnvValue from '../../../../utils/formatter/clgEnvValue';

interface IProps {
  revision?: appModel.IUIApplicationRevision;
}

interface IState {
  revision?: appModel.IUIApplicationRevision;
  envVariablesCollapsed: boolean;
}

class ApplicationDetailRevisionSidePanel extends React.Component<IProps, IState> {
  private readonly COMPONENT = 'ApplicationDetailRevisionSidePanel';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  constructor(props) {
    super(props);
    this.logger.debug('constructor');

    this.state = {
      envVariablesCollapsed: true,
      revision: props.revision ? props.revision : undefined,
    };

    // use the bind to enable setState within this function
    this.toggleEnvVariables = this.toggleEnvVariables.bind(this);
  }

  public UNSAFE_componentWillReceiveProps(newProps) {
    this.logger.debug('componentWillReceiveProps');
    this.setState({ revision: newProps.revision });
  }

  public render() {
    this.logger.debug('render');

    // render nothing if the revision is not set, properly!
    if (typeof this.state.revision === 'undefined') {
      return <React.Fragment />;
    }

    // convert the memory in bytes to MiB
    const memoryToUse = memoryUtils.convertBytesToUnit(this.state.revision.memory, 'mib');

    return (
      <div className='clg--side-panel'>
        <h6 className='clg--side-panel__section-heading first'>{t('clg.page.application.revision.section.source')}</h6>
        <div className='clg--side-panel__section-content'>
          <div className='bx--row'>
            <div className='bx--col-lg-16'>
              <FormLabel>{t('clg.application.imagePullSecret.label')}</FormLabel>
              <FormItem id={'application-revision-imagePullSecret'}>{this.state.revision.imagePullSecret || t('clg.component.registrySelector.default.usepublic.label')}</FormItem>
            </div>
          </div>
          <div className='bx--row'>
            <div className='bx--col-lg-16'>
              <FormLabel>{t('clg.application.image.label')}</FormLabel>
              <FormItem id={'application-revision-image'}>{this.state.revision.image}</FormItem>
            </div>
          </div>
        </div>
        <hr className='clg--side-panel__section-separator' />

        <h6 className='clg--side-panel__section-heading'>{t('clg.page.application.revision.section.runtime')}</h6>
        <div className='clg--side-panel__section-content'>
          <div className='bx--row'>
            <div className='bx--col-md-4'>
              <FormLabel>{t('clg.application.limit.memory.label')}</FormLabel>
              <FormItem id={'application-revision-memory'}>{memoryToUse}</FormItem>
            </div>
            <div className='bx--col-md-4'>
              <FormLabel>{t('clg.application.limit.cpus.label')}</FormLabel>
              <FormItem id={'application-revision-cpus'}>{this.state.revision.cpus}</FormItem>
            </div>
          </div>
          <div className='bx--row'>
            <div className='bx--col-md-4'>
              <FormLabel>{t('clg.application.limit.timeoutSeconds.label')}</FormLabel>
              <FormItem id={'application-revision-timeout'}>{this.state.revision.timeoutSeconds}</FormItem>
            </div>
            <div className='bx--col-md-4'>
              <FormLabel>{t('clg.application.limit.containerConcurrency.label')}</FormLabel>
              <FormItem id={'application-revision-concurrency'}>{this.state.revision.containerConcurrency}</FormItem>
            </div>
          </div>
          <div className='bx--row'>
            <div className='bx--col-md-4'>
              <FormLabel>{t('clg.application.limit.minScale.label')}</FormLabel>
              <FormItem id={'application-revision-minscale'}>{this.state.revision.minScale}</FormItem>
            </div>
            <div className='bx--col-md-4'>
              <FormLabel>{t('clg.application.limit.maxScale.label')}</FormLabel>
              <FormItem id={'application-revision-maxscale'}>{this.state.revision.maxScale}</FormItem>
            </div>
          </div>
        </div>
        <hr className='clg--side-panel__section-separator' />

        <h6 className='clg--side-panel__section-heading'>
          {this.state.envVariablesCollapsed === true &&
            <a id={'environment-variables-toggle'} onClick={this.toggleEnvVariables} className='toogle-section'><ChevronRight16 /></a>
          }
          {this.state.envVariablesCollapsed === false &&
            <a id={'environment-variables-toggle'} onClick={this.toggleEnvVariables} className='toogle-section'><ChevronDown16 /></a>
          }
          {t('clg.page.application.revision.section.env')}
        </h6>
        {this.state.envVariablesCollapsed === false &&
          <div className='clg--side-panel__section-content'>{this.listEnvVariables(this.state.revision.parameters)}</div>
        }
        <hr className='clg--side-panel__section-separator' />

        <h6 className='clg--side-panel__section-heading'>{t('clg.page.application.revision.section.status')}</h6>
        <div id={'application-revision-status'} className='clg--side-panel__section-content'>
          {this.state.revision.status === UIEntityStatus.READY ?
            (<React.Fragment>{clgAppStatus.render(this.state.revision)}</React.Fragment>)
            :
            (<React.Fragment>{this.listStatusConditions(this.state.revision.statusConditions)}</React.Fragment>)
          }
        </div>
      </div>
    );
  }

  private toggleEnvVariables(): void {
    this.setState({ envVariablesCollapsed: !this.state.envVariablesCollapsed });
  }

  private listEnvVariables(envVariables: IUIEnvItems) {
    const variablesToRender = [];
    if (envVariables && Array.isArray(envVariables)) {
      for (let i = 0; i < envVariables.length; i++) {
        variablesToRender.push(
          <div key={`env-param-${i}`} className='bx--row variable'>
            <div className='bx--col-md-4'>
              <FormLabel>{t('clg.application.env.name')}</FormLabel>
              <FormItem id={`env-param-${i}-key`}>{clgEnvName.value(envVariables[i])}</FormItem>
            </div>
            <div className='bx--col-md-4'>
              <FormLabel>{t('clg.application.env.value')}</FormLabel>
              <FormItem id={`env-param-${i}-value`}>{clgEnvValue.value(envVariables[i])}</FormItem>
            </div>
          </div>
        );
      }
    } else {
      variablesToRender.push(
        <div id={'empty-parameters-list'} key='no-variables' className='bx--row'><div className='bx--col-md-8'>{t('clg.page.application.tab.env.noVariables')}</div></div>
      );
    }
    return variablesToRender;
  }

  private getConditionStatus(condition: appModel.IUIApplicationStatusCondition): string {
    if (condition.severity === 'Info') {

      // in case this is just an info message regarding the active status, we should show a checkmark
      if (condition.type === 'Active') {
        return 'ok';
      }

      return 'info';
    }

    if (condition.status === 'True') {
      return 'ok';
    }

    if (condition.status === 'Unknown' && condition.reason === 'Deploying') {
      return 'pending';
    }

    return 'failed';
  }

  private listStatusConditions(conditions) {
    const conditionsToRender = [];
    if (conditions && Array.isArray(conditions)) {
      for (let i = 0; i < conditions.length; i++) {
        conditionsToRender.push(
          <div key={`status-condition-${i}`} className='bx--row status-condition'>
            <div className='bx--col-md-4'>
              {this.getConditionStatus(conditions[i]) === 'info' &&
                (
                  <InformationFilled16 className='fill-info' title={conditions[i].status} />
                )
              }
              {this.getConditionStatus(conditions[i]) === 'ok' &&
                (
                  <CheckmarkFilled16 className='fill-success' title={conditions[i].status} />
                )
              }
              {this.getConditionStatus(conditions[i]) === 'pending' &&
                (
                  <Hourglass16 className='fill-info' title={conditions[i].status} />
                )
              }
              {this.getConditionStatus(conditions[i]) === 'failed' &&
                (
                  <ErrorFilled16 className='fill-failed' title={conditions[i].status} />
                )
              }
              <span className='status-condition--type'>{conditions[i].type}</span>
            </div>
            <div className='bx--col-md-4 status-condition--date'>{dateUtils.format(conditions[i].lastTransitionTime, getLocale(window.navigator.language), true)}</div>
            {conditions[i].status !== 'True' && conditions[i].message && (
              <div className='bx--col-md-8 status-condition--message'>
                <FormLabel>{t('clg.application.status.message')}:</FormLabel>
                <FormItem className={'message-text'}>{conditions[i].message}</FormItem>
              </div>
            )}
          </div>
        );
      }
    }
    return conditionsToRender;
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ApplicationDetailRevisionSidePanel.propTypes = {
  revision: PropTypes.object,
};

export default ApplicationDetailRevisionSidePanel;
