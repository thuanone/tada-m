// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { Modal } from '@console/pal/carbon-components-react';

// coligo
import * as commonModel from '../../../../common/model/common-model';
import * as secretModel from '../../../../common/model/config-model';
import * as configModel from '../../../../common/model/config-model';
import * as projectModel from '../../../../common/model/project-model';
import t from '../../../utils/i18n';
import ClgRegistryFrom from '../ClgRegistryForm/ClgRegistryForm';

interface IProps {
  onClose: () => void;
  onCreated: (createdRegistry: configModel.IUIRegistrySecret) => void;
  open: boolean;
  project?: projectModel.IUIProject;
}

interface IState {
  createFn?: () => void;
  isCreating: boolean;
  isFormValid: boolean;
}

// setup the logger
const COMPONENT = 'ClgRegistryModal';
const logger = log.getLogger(COMPONENT);

class ClgRegistryModal extends React.Component<IProps, IState> {

  constructor(props) {
    super(props);
    logger.debug('constructor');

    this.state = {
      isCreating: false,
      isFormValid: false,
    };

    this.create = this.create.bind(this);
    this.onCreationSucceeded = this.onCreationSucceeded.bind(this);
    this.onCreationFailed = this.onCreationFailed.bind(this);
    this.onUserUpdate = this.onUserUpdate.bind(this);
    this.receiveCreateFn = this.receiveCreateFn.bind(this);
  }

  public onCreationSucceeded(createdRegistry: secretModel.IUIRegistrySecret) {
    const fn = 'onCreationSucceeded ';
    logger.debug(`${fn}> createdRegistry: '${secretModel.stringify(createdRegistry)}'`);

    // set the loading state
    this.setState({ isCreating: false });

    this.props.onCreated(createdRegistry);

    logger.debug(`${fn}<`);
  }

  public onUserUpdate(isFormValid: boolean) {
    const fn = 'onUserUpdate ';
    logger.debug(`${fn}> isFormValid? ${isFormValid}`);

    // set the loading state
    this.setState({ isFormValid });

    logger.debug(`${fn}<`);
  }

  public onCreationFailed(requestError: commonModel.UIRequestError) {
    const fn = 'onCreationFailed ';
    logger.debug(`${fn}> error: ${commonModel.stringifyUIRequestError(requestError)}`);

    // set the loading state
    this.setState({ isCreating: false });

    logger.debug(`${fn}<`);
  }

  public create() {
    const fn = 'create ';
    logger.debug(`${fn}> `);

    // set the loading state
    this.setState({ isCreating: true });

    // execute the create function
    this.state.createFn();

    logger.debug(`${fn}<`);
  }

  public render() {
    logger.debug('render');

    // render nothing if the project is not set, properly!
    if (typeof this.props.project === 'undefined') {
      return <React.Fragment />;
    }

    // render nothing if the modal is not open
    if (!!!this.props.open) {
      return <React.Fragment />;
    }

    return (
      <Modal
        className='container-registry-modal'
        iconDescription={t('clg.common.label.close')}
        onRequestClose={this.props.onClose}
        onRequestSubmit={this.state.createFn}
        onSecondarySubmit={this.props.onClose}
        open={this.props.open}
        shouldSubmitOnEnter={true}
        hasForm={false}
        size={'sm'}
        selectorPrimaryFocus='#create-registry-name'
        modalHeading={t('clg.modal.registry.add.title')}
        modalAriaLabel={t('clg.modal.registry.add.title')}
        primaryButtonText={t('clg.common.label.add')}
        secondaryButtonText={t('clg.common.label.cancel')}
      >
        <p>{t('clg.modal.registry.add.message')}</p>
        <ClgRegistryFrom
          onGetCreateFunction={this.receiveCreateFn}
          onCreationSucceeded={this.onCreationSucceeded}
          onCreationFailed={this.onCreationFailed}
          onUserUpdate={this.onUserUpdate}
          project={this.props.project}
          light={true}
        />
      </ Modal>
    );
  }

  private receiveCreateFn(createFn: any) {
    this.setState({ createFn });
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgRegistryModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  project: PropTypes.object,
};

export default ClgRegistryModal;
