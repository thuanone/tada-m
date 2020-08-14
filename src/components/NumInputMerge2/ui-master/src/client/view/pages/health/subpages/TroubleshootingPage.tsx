
import PropTypes from 'prop-types';
import React from 'react';
import { withRouter } from 'react-router-dom';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { Launch16 } from '@carbon/icons-react';
import { Button, Form, FormGroup, Link as CarbonLink, TextInput } from '@console/pal/carbon-components-react';
import { Card, CardBody, CardHeader, Message } from '@console/pal/Components';
import { getLocale } from '@console/pal/Utilities';

import * as commonModel from '../../../../../common/model/common-model';
import * as healthApi from '../../../../api/health-api';
import * as dateUtils from '../../../../utils/date';
import t from '../../../../utils/i18n';
import { IClgInlineNotification } from '../../../model/common-view-model';

const LOGDNA_PROD = 'https://app.us-south.logging.cloud.ibm.com/ext/ibm-sso/a590996c28';
const LOGDNA_TEST = 'https://app.us-south.logging.cloud.ibm.com/ext/ibm-sso/f88229fb24';
const LOGDNA_DEV = 'https://app.us-south.logging.cloud.ibm.com/ext/ibm-sso/2e49e68d0e';

interface IProps {
  history: any[];
}

interface IState {
  error: any;
  clgId?: string;
  clgContext?: any;
  isLoadingColigoContext: boolean;
}

class TroubleshootingPage extends React.Component<IProps, IState> {
  private readonly COMPONENT = 'TroubleshootingPage';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  constructor(props) {
    super(props);
    this.state = {
      clgId: undefined,
      error: undefined,
      isLoadingColigoContext: false,
    };

    this.retrieveColigoContext = this.retrieveColigoContext.bind(this);
    this.handleClgIdChange = this.handleClgIdChange.bind(this);
  }

  public render() {
    this.logger.debug('render');
    const subpageClassNames = 'page';

    if (this.state.error) {
      return (
        <div className={subpageClassNames}>
          <Message
            caption={this.state.error.error ? this.state.error.error.clgId : ''}
            text={`${t('clg.page.error.title')} ${t('clg.page.error.subtitle')}`}
            icon='ERROR'
            isTileWrapped={true}
          />
        </div>
      );
    }

    let consoleLogDnaInstance = LOGDNA_PROD;
    if (window && window.location && window.location.hostname) {
      if (window.location.hostname.indexOf('dev.console.') > -1) {
        consoleLogDnaInstance = LOGDNA_DEV;
      } else if (window.location.hostname.indexOf('test.') > -1) {
        consoleLogDnaInstance = LOGDNA_TEST;
      }
    }

    return (
      <div className={subpageClassNames}>
        <React.Fragment>
          <div className='bx--row troubleshooting--input'>
            <div className='bx--col-lg-6'>
              <Card>
                <CardHeader title={t('clg.page.health-status.troubleshooting.subtitle')} />
                <CardBody>
                  <div className='pal--card__labeled-rows'>
                    <p>{t('clg.page.health-status.troubleshooting.consolelogs')}</p>
                    <p><CarbonLink href={consoleLogDnaInstance} target='_blank' >{consoleLogDnaInstance}<Launch16 className='clg-filled-link clg-link-icon' /></CarbonLink></p>
                    <p>{t('clg.page.health-status.troubleshooting.analyze')}</p>
                  </div>
                  <Form>
                    <FormGroup legendText=''>
                      <TextInput
                        id={'clg-id'}
                        light={true}
                        labelText={t('clg.page.health-status.troubleshooting.id.label')}
                        helperText={t('clg.page.health-status.troubleshooting.id.helper')}
                        placeholder={t('clg.page.health-status.troubleshooting.id.placeholder')}
                        type={'text'}
                        value={this.state.clgId}
                        onChange={this.handleClgIdChange}
                      />
                    </FormGroup>
                    <Button kind='primary' disabled={!this.state.clgId} size='field' onClick={this.retrieveColigoContext} className={'get-coligocontext-btn'}>{t('clg.page.health-status.troubleshooting.action')}</Button>
                  </Form>
                </CardBody>
              </Card>
            </div>
          </div>

          {this.state.clgContext &&
            (
              <div className='bx--row troubleshooting--result'>
                <div className='bx--col-lg-6'>
                  <Card className=''>
                    <CardHeader title={t('clg.page.health-status.troubleshooting.result')} />
                    <CardBody>
                      {!this.state.clgContext.tid &&
                        <span>{t('clg.page.health-status.troubleshooting.result.failed')}</span>
                      }
                      {this.state.clgContext.tid &&
                        (
                          <div className='pal--card__labeled-rows'>
                            <p>{t('clg.page.health-status.troubleshooting.result.date')}</p>
                            <p>{dateUtils.format(this.state.clgContext.date, getLocale(window.navigator.language), true)}</p>
                            <p>{t('clg.page.health-status.troubleshooting.result.tid')}</p><p>{this.state.clgContext.tid}</p>
                            <p>{t('clg.page.health-status.troubleshooting.result.user')}</p><p>{this.state.clgContext.user}</p>
                            {this.state.clgContext.error &&
                              <React.Fragment><p>{t('clg.page.health-status.troubleshooting.result.error')}</p><p>{this.state.clgContext.error}</p></React.Fragment>
                            }
                          </div>
                        )
                      }
                    </CardBody>
                  </Card>
                </div>
              </div>
            )
          }
        </React.Fragment>
      </div>
    );
  }

  private retrieveColigoContext() {
    const fn = 'retrieveColigoContext ';
    this.logger.debug(`${fn}>`);

    this.setState({ isLoadingColigoContext: true, clgContext: undefined });

    // retrieve the Coligo Context by using the thin client-side API layer
    healthApi.doGetColigoContext(this.state.clgId).then((requestResult: commonModel.IUIRequestResult) => {
      this.logger.debug(`${fn}- result: '${JSON.stringify(requestResult)}'`);

      // update the state of the page
      this.setState({ isLoadingColigoContext: false, clgContext: requestResult.payload });
    }).catch((requestError: commonModel.UIRequestError) => {
      this.logger.warn(`${fn}- An error occurred during coligo context evaluation: '${JSON.stringify(requestError)}'`);

      // in case the response could not be mapped to a specific error, we should use a generic one
      const errorNotification: IClgInlineNotification = {
        kind: 'error',
        subtitle: t(requestError.error.code),
        title: t('clg.page.health-status.troubleshooting.error.contextDetectionFailed.titlte'),
      };
      this.setState({ isLoadingColigoContext: false, error: errorNotification });
    });
  }

  private handleClgIdChange(event) {
    if (event.target) {
      this.setState({
        clgId: event.target.value,
      });
    }
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
TroubleshootingPage.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func,
  }),
};

export default withRouter(TroubleshootingPage);
