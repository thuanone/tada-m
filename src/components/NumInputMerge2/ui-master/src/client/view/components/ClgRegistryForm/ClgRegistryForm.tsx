// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { FormLabel, FormItem, InlineNotification, NotificationActionButton, TextInput } from '@console/pal/carbon-components-react';

// codeengine
import * as commonModel from '../../../../common/model/common-model';
import * as secretModel from '../../../../common/model/config-model';
import * as projectModel from '../../../../common/model/project-model';
import * as coligoValidatorConfig from '../../../../common/validator/coligo-validator-config';
import * as commonValidator from '../../../../common/validator/common-validator';
import { TextValidator } from '../../../../common/validator/text-validator';
import * as secretsApi from '../../../api/secret-api';
import t from '../../../utils/i18n';
import toastNotification from '../../../utils/toastNotification';
import ClgTextInput from '../../components/ClgTextInput/ClgTextInput';
import * as viewCommonModel from '../../model/common-view-model';

interface IProps {
  light?: boolean;
  onGetCreateFunction: (createFn) => void;
  onCreationSucceeded: (createdRegistry: secretModel.IUIRegistrySecret) => void;
  onCreationFailed: (requestError: commonModel.UIRequestError) => void;
  onUserUpdate: (isFormValid: boolean) => void;
  project?: projectModel.IUIProject;
  registry?: secretModel.IUIRegistrySecret;
}

interface IState {
  error?: viewCommonModel.IClgInlineNotification;
  email: commonValidator.IClgTextField;
  registryName: commonValidator.IClgTextField;
  registryServer: commonValidator.IClgTextField;
  isCreateDisabled: boolean;
  isCreating: boolean;
  isUsernameDisabled: boolean;
  password: commonValidator.IClgTextField; // pragma: allowlist secret
  username: commonValidator.IClgTextField;
}

// setup the logger
const COMPONENT = 'ClgRegistryForm';
const logger = log.getLogger(COMPONENT);

class ClgRegistryForm extends React.Component<IProps, IState> {

  private readonly IBM_CR_DOMAIN_PATTERN = '.icr.io';
  private readonly IBM_CR_USERNAME = 'iamapikey';

  private readonly NAME_RULES: commonValidator.IClgTextFieldRules = coligoValidatorConfig.default.registry.name;
  private readonly SERVER_RULES: commonValidator.IClgTextFieldRules = coligoValidatorConfig.default.registry.server;
  private readonly USERNAME_RULES: commonValidator.IClgTextFieldRules = coligoValidatorConfig.default.registry.username;
  private readonly PASSWORD_RULES: commonValidator.IClgTextFieldRules = coligoValidatorConfig.default.registry.password;
  private readonly EMAIL_RULES: commonValidator.IClgTextFieldRules = coligoValidatorConfig.default.registry.email;
  private readonly textValidator: commonValidator.IClgFieldValidator = new TextValidator();

  constructor(props: IProps) {
    super(props);

    // init the state
    this.state = {
      email: {
        val: '',
      },
      isCreateDisabled: true,
      isCreating: false,
      isUsernameDisabled: false,
      password: { // pragma: allowlist secret
        val: '',
      },
      registryName: {
        val: '',
      },
      registryServer: {
        val: '',
      },
      username: {
        val: '',
      },
    };

    this.closeNotification = this.closeNotification.bind(this);
    this.createNewRegistry = this.createNewRegistry.bind(this);
    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleRegistryNameChange = this.handleRegistryNameChange.bind(this);
    this.handleRegistryServerChange = this.handleRegistryServerChange.bind(this);
    this.handleUsernameChange = this.handleUsernameChange.bind(this);
    this.resetForm = this.resetForm.bind(this);

    // populate the creation function to the parent
    props.onGetCreateFunction(this.createNewRegistry);
  }

  public render() {
    logger.debug('render');

    // we will only show a read-only info view of the secret, until we've implemented the whole update story
    if (this.props.registry) {
      return (
        <div className='coligo-form'>
          <div>
            <div className='bx--row'>
              <div className='bx--col-lg-16 bx--col-md-8 bx--col-sm-4'>
                <FormLabel>{t('clg.registry.name.label')}</FormLabel>
                <FormItem id={'registry-name'}>{this.props.registry.name}</FormItem>
              </div>
            </div>

            <div className='bx--row'>
              <div className='bx--col-lg-16 bx--col-md-8 bx--col-sm-4'>
                <FormLabel>{t('clg.registry.server.label')}</FormLabel>
                <FormItem id={'registry-server'}>{this.props.registry.server}</FormItem>
              </div>
            </div>

            <div className='bx--row'>
              <div className='bx--col-lg-16 bx--col-md-8 bx--col-sm-4'>
                <FormLabel>{t('clg.registry.username.label')}</FormLabel>
                <FormItem id={'registry-username'}>{this.props.registry.username}</FormItem>
              </div>
            </div>

            <div className='bx--row'>
              <div className='bx--col-lg-16 bx--col-md-8 bx--col-sm-4'>
                <FormLabel>{t('clg.registry.password.label')}</FormLabel>
                <FormItem id={'registry-password'}><span style={{fontStyle: 'italic'}}>{t('clg.registry.password.maskedvalue')}</span></FormItem>
              </div>
            </div>

            <div className='bx--row'>
              <div className='bx--col-lg-16 bx--col-md-8 bx--col-sm-4'>
                <FormLabel>{t('clg.registry.email.label')}</FormLabel>
                <FormItem id={'registry-email'}>{this.props.registry.email || '-'}</FormItem>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className='coligo-form'>
        {this.state.error &&
          (
            <React.Fragment>
              <InlineNotification
                kind={this.state.error.kind}
                statusIconDescription={this.state.error.title}
                lowContrast={true}
                title={this.state.error.title}
                subtitle={(<span>{t(this.state.error.subtitle)}</span>)}
                onCloseButtonClick={this.closeNotification}
                actions={this.state.error.actionFn &&
                  (
                    <NotificationActionButton
                      onClick={this.state.error.actionFn}
                    >
                      {this.state.error.actionTitle}
                    </NotificationActionButton>
                  )
                }
              />
              {this.state.error.clgId &&
                <div className='coligo-id'>ErrorID: {this.state.error.clgId}</div>
              }
            </React.Fragment>
          )
        }

        <div>
          <div className='bx--row'>
            <div className='bx--col-lg-16 bx--col-md-8 bx--col-sm-4'>
              <TextInput
                id={'registry-name'}
                labelText={t('clg.registry.name.label')}
                placeholder={t('clg.registry.name.placeholder')}
                type={'text'}
                value={this.state.registryName.val}
                invalid={typeof this.state.registryName.invalid !== 'undefined'}
                invalidText={t('clg.registry.name.invalid.' + this.state.registryName.invalid, this.NAME_RULES)}
                light={!!this.props.light}
                onChange={this.handleRegistryNameChange}
                tabIndex={0}
                disabled={this.state.isCreating}
              />
            </div>
          </div>

          <div className='bx--row'>
            <div className='bx--col-lg-16 bx--col-md-8 bx--col-sm-4'>
              <ClgTextInput
                hasPlaceholderText={true}
                hasTooltip={true}
                inputId='registry-server'
                isDisabled={this.state.isCreating}
                light={!!this.props.light}
                nlsKey='clg.registry.server'
                onChange={this.handleRegistryServerChange}
                textField={this.state.registryServer}
                validationRules={this.SERVER_RULES}
              />
            </div>
          </div>

          <div className='bx--row'>
            <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4'>
              <ClgTextInput
                hasPlaceholderText={true}
                hasTooltip={true}
                inputId='registry-username'
                isDisabled={this.state.isCreating || this.state.isUsernameDisabled}
                light={!!this.props.light}
                nlsKey='clg.registry.username'
                onChange={this.handleUsernameChange}
                textField={this.state.username}
                validationRules={this.USERNAME_RULES}
              />
            </div>
            <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4'>
              <ClgTextInput
                hasPlaceholderText={true}
                hasTooltip={true}
                inputId='registry-password'
                isDisabled={this.state.isCreating}
                isSecret={true}
                light={!!this.props.light}
                nlsKey='clg.registry.password'
                onChange={this.handlePasswordChange}
                textField={this.state.password}
                validationRules={this.PASSWORD_RULES}
              />
            </div>
          </div>

          <div className='bx--row'>
            <div className='bx--col-lg-16 bx--col-md-8 bx--col-sm-4'>
              <ClgTextInput
                hasPlaceholderText={true}
                hasTooltip={true}
                inputId='registry-email'
                isDisabled={this.state.isCreating}
                light={!!this.props.light}
                nlsKey='clg.registry.email'
                onChange={this.handleEmailChange}
                textField={this.state.email}
                validationRules={this.EMAIL_RULES}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  private closeNotification() {
    this.setState({ error: undefined });
  }

  private shouldDisableCreate(
    registryName: commonValidator.IClgTextField,
    registryServer: commonValidator.IClgTextField,
    username: commonValidator.IClgTextField,
    password: commonValidator.IClgTextField, // pragma: allowlist secret
    email: commonValidator.IClgTextField,
    project: projectModel.IUIProject): boolean {

    const fn = 'shouldDisableCreate ';

    logger.debug(`${fn}> registryName: '${JSON.stringify(registryName)}', project: '${JSON.stringify(project)}'}'`);

    // check if all mandatory fields are set are set
    const allFieldsSet = registryName.val && registryName.val !== '' && registryServer.val && registryServer.val !== '' && username.val && username.val !== '' && password.val && password.val !== '' && project;

    // check if all fields were validated
    if (allFieldsSet &&
      !registryName.invalid &&
      !registryServer.invalid &&
      !username.invalid &&
      !password.invalid &&
      !email.invalid) {

      // the form is valid. push that information to the parent component
      this.props.onUserUpdate(true);

      logger.debug(`${fn}< false`);
      return false;
    }

    // the form is valid. push that information to the parent component
    this.props.onUserUpdate(false);

    // disable the create button
    logger.debug(`${fn}< true`);
    return true;
  }

  private handleRegistryNameChange(event) {
    if (event.target) {
      const field: commonValidator.IClgTextField = commonValidator.getValidatedTextField(event.target.value, this.textValidator, this.NAME_RULES);

      this.setState({
        error: undefined,
        isCreateDisabled: this.shouldDisableCreate(field, this.state.registryServer, this.state.username, this.state.password, this.state.email, this.props.project),
        registryName: field,
      });
    }
  }

  private handleRegistryServerChange(event) {
    if (event.target) {
      const field: commonValidator.IClgTextField = commonValidator.getValidatedTextField(event.target.value, this.textValidator, this.SERVER_RULES);

      const usernameField = this.state.username;
      let isUsernameDisabled = false;

      // Check whether the server points to an IBM Container registry. If that is true we can assume that the username has a certain value
      if (field.val.indexOf(this.IBM_CR_DOMAIN_PATTERN) > -1 && (!usernameField.val || usernameField.val.length === 0)) {
        usernameField.val = this.IBM_CR_USERNAME;
        delete usernameField.invalid;
        isUsernameDisabled = true;
      }

      this.setState({
        error: undefined,
        isCreateDisabled: this.shouldDisableCreate(this.state.registryName, field, usernameField, this.state.password, this.state.email, this.props.project),
        isUsernameDisabled,
        registryServer: field,
        username: usernameField,
      });
    }
  }

  private handleEmailChange(event) {
    if (event.target) {
      const field: commonValidator.IClgTextField = commonValidator.getValidatedTextField(event.target.value, this.textValidator, this.EMAIL_RULES);

      this.setState({
        email: field,
        error: undefined,
        isCreateDisabled: this.shouldDisableCreate(this.state.registryName, this.state.registryServer, this.state.username, this.state.password, field, this.props.project),
      });
    }
  }

  private handleUsernameChange(event) {
    if (event.target) {
      const field: commonValidator.IClgTextField = commonValidator.getValidatedTextField(event.target.value, this.textValidator, this.USERNAME_RULES);

      this.setState({
        error: undefined,
        isCreateDisabled: this.shouldDisableCreate(this.state.registryName, this.state.registryServer, field, this.state.password, this.state.email, this.props.project),
        username: field,
      });
    }
  }

  private handlePasswordChange(event) {
    if (event.target) {
      const field: commonValidator.IClgTextField = commonValidator.getValidatedTextField(event.target.value, this.textValidator, this.PASSWORD_RULES);

      this.setState({
        error: undefined,
        isCreateDisabled: this.shouldDisableCreate(this.state.registryName, this.state.registryServer, this.state.username, field, this.state.email, this.props.project),
        password: field, // pragma: allowlist secret
      });
    }
  }

  private resetForm() {
    this.setState({
      email: {
        val: '',
      },
      isCreateDisabled: true,
      isCreating: false,
      isUsernameDisabled: false,
      password: { // pragma: allowlist secret
        val: '',
      },
      registryName: {
        val: '',
      },
      registryServer: {
        val: '',
      },
      username: {
        val: '',
      },
    });
  }

  private createNewRegistry() {
    const fn = 'createNewRegistry ';
    logger.debug(`${fn}>`);

    this.setState({ isCreating: true });

    // build the project that shall be created
    const registryToCreate: secretModel.IUIRegistrySecret = {
      id: undefined,
      kind: commonModel.UIEntityKinds.SECRET,
      name: this.state.registryName.val,
      password: this.state.password.val, // pragma: allowlist secret
      projectId: this.props.project.id,
      regionId: this.props.project.region,
      server: this.state.registryServer.val,
      type: 'Registry',
      username: this.state.username.val,
    };

    // add the email, if set
    if (this.state.email.val && this.state.email.val !== '') {
      registryToCreate.email = this.state.email.val;
    }

    // create the registry using a thin client-side API layer
    secretsApi.createSecret(this.props.project.region, this.props.project.id, registryToCreate).then((createdRegistry: secretModel.IUISecret) => {
      logger.debug(`${fn}- result: '${secretModel.stringify(createdRegistry)}'`);

      // hide the loading animation
      this.setState({ isCreating: false, });

      // show a toast notification
      const successNotification: viewCommonModel.IClgToastNotification = {
        kind: 'success',
        subtitle: t('clg.page.create.registry.success.subtitle', { name: createdRegistry.name }),
        title: t('clg.page.create.registry.success.title'),
      };
      toastNotification.add(successNotification);

      // reset the form
      this.resetForm();

      // publish the succeeded creation to the parent
      this.props.onCreationSucceeded(createdRegistry as secretModel.IUIRegistrySecret);
    }).catch((requestError: commonModel.UIRequestError) => {
      logger.warn(`${fn}- An error occurred during registry creation: '${commonModel.stringifyUIRequestError(requestError)}'`);

      if (requestError.error && requestError.error.name === 'FailedToCreateSecretBecauseAlreadyExistsError') {
        // invalidate the registryName
        const registryName = this.state.registryName;
        registryName.invalid = 'EXISTS';

        // set the inline notification
        const registryExistsNotification: viewCommonModel.IClgInlineNotification = {
          kind: 'error',
          subtitle: t('clg.page.create.registry.error.registryExists.desc', { name: this.state.registryName.val }),
          title: t('clg.page.create.registry.error.registryExists.title'),
        };
        this.setState({ error: registryExistsNotification, isCreating: false, isCreateDisabled: true, registryName });
      } else {
        // in case the response could not be mapped to a specific creation error, we should use a generic one
        const errorNotification: viewCommonModel.IClgInlineNotification = {
          // clgId: requestError.clgId,
          kind: 'error',
          title: t('clg.page.create.registry.error.creationFailed.title'),
        };
        this.setState({ isCreating: false, error: errorNotification });
      }

      // publish the failed creation to the parent
      this.props.onCreationFailed(requestError);
    });
  }
}
// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgRegistryForm.propTypes = {
  light: PropTypes.bool,
  onCreationFailed: PropTypes.func.isRequired,
  onCreationSucceeded: PropTypes.func.isRequired,
  onGetCreateFunction: PropTypes.func.isRequired,
  onUserUpdate: PropTypes.func.isRequired,
  project: PropTypes.object,
  registry: PropTypes.object,
};

export default ClgRegistryForm;
