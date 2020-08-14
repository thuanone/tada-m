// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import {
    InlineNotification,
    NotificationActionButton,
    TextInput,
} from '@console/pal/carbon-components-react';
import PageHeaderSkeleton from '@console/pal/Components/PageHeader/skeleton';

// coligo
import {
    UIEntityKinds,
    UIRequestError
} from '../../../../../common/model/common-model';
import * as configModel from '../../../../../common/model/config-model';
import * as projectModel from '../../../../../common/model/project-model';
import coligoValidatorConfig from '../../../../../common/validator/coligo-validator-config';
import {
    getValidatedTextField,
    IClgKeyValueFields,
    IClgTextField,
    validateField
} from '../../../../../common/validator/common-validator';
import { TextValidator } from '../../../../../common/validator/text-validator';
import * as secretApi from '../../../../api/secret-api';
import t from '../../../../utils/i18n';
import nav from '../../../../utils/nav';
import toastNotification from '../../../../utils/toastNotification';
import { IConfigTypes } from '../../../common/types';
import ClgKeyValueFields from '../../../components/ClgKeyValueFields/ClgKeyValueFields';
import * as viewCommonModel from '../../../model/common-view-model';

const GlobalTextValidator = new TextValidator();

interface IProps {
    history: any;
    onCreateDisabledChanged: (configType, newValue) => void;
    onGetCreateFunction: (createFn) => void;
    onGetSelectFunction: (secretFn) => void;
    onIsCreatingChanged: (configType, isCreating) => void;
    selectedProject: projectModel.IUIProject;
}

interface IState {
    keyvalueFields: IClgKeyValueFields;
    error?: viewCommonModel.IClgInlineNotification;
    isNameInvalid: boolean;
    isCreateDisabled: boolean;
    isCreating: boolean;
    isLoading: boolean;
    secretName: IClgTextField;
}

class CreateGenericSecretSubpage extends React.Component<IProps, IState> {
    private readonly COMPONENT = 'CreateGenericSecretSubpage';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    private mounted = false;

    constructor(props: IProps) {
        super(props);
        this.state = {
            isCreateDisabled: true,
            isCreating: false,
            isLoading: true,
            isNameInvalid: false,
            keyvalueFields: {
                val: [],
            },
            secretName: getValidatedTextField('', GlobalTextValidator, coligoValidatorConfig.secret.name, true),
        };

        // resetting '.invalid' fields for all input fields, so they only show the invalid information, once a field got changed
        this.state.secretName.invalid = undefined;

        this.handleKeyvalueFieldsChange = this.handleKeyvalueFieldsChange.bind(this);
        this.createNewGenericSecret = this.createNewGenericSecret.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleSecretNameChange = this.handleSecretNameChange.bind(this);
        this.initialize = this.initialize.bind(this);
        this.closeNotification = this.closeNotification.bind(this);
        this.setIsCreateDisabled = this.setIsCreateDisabled.bind(this);
        this.setIsCreating = this.setIsCreating.bind(this);
        this.unsetIsCreateDisabled = this.unsetIsCreateDisabled.bind(this);
        this.unsetIsCreating = this.unsetIsCreating.bind(this);

        if (props.onGetCreateFunction) {
            props.onGetCreateFunction(this.createNewGenericSecret);
        }

        if (props.onGetSelectFunction) {
            props.onGetSelectFunction(this.initialize);
        }
    }

    public componentDidMount() {
        this.logger.debug(`${this.COMPONENT}componentDidMount > ...`);

        this.setState({ isLoading: false });
        this.checkInputFieldValidity();

        window.scrollTo(0, 0);
        this.mounted = true;

        this.setIsCreateDisabled();
    }

    /**
     * Re-initialize state, when this subpage becomes active again (like checking status of Create Button, etc)
     */
    public initialize() {
        if (this.mounted) {
            this.logger.debug('initialize');
            this.setIsCreateDisabled();
        }
    }

    public render() {
        if (this.state.isLoading && !this.state.error) { return <PageHeaderSkeleton title={true} breadcrumbs={true} />; }
        return (
            <div className='clg-create-genericsecret-subpage'>
                {this.state.error &&
                    (
                        <InlineNotification
                            kind={this.state.error.kind}
                            lowContrast={true}
                            statusIconDescription={this.state.error.title}
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
                    )
                }
                <div className='bx--row last-row-of-section'>
                    <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4'>
                        <TextInput
                            id={'create-genericsecret-name'}
                            labelText={t('clg.secret.name.label')}
                            placeholder={t('clg.secret.name.placeholder')}
                            type={'text'}
                            invalid={!!this.state.secretName.invalid}
                            invalidText={t('clg.secret.name.invalid.' + this.state.secretName.invalid, { maxLength: coligoValidatorConfig.secret.name.maxLength })}
                            onChange={this.handleSecretNameChange}
                            value={this.state.secretName.val}
                            tabIndex={0}
                        />
                    </div>
                </div>

                <h4 className='productive-heading-03'>{t('clg.page.create.config.keyvalues.heading')}</h4>
                <div className='bx--row'>
                    <div className='bx--col-lg-8 bx--col-md-8 bx--col-sm-4 subsection-subtitle'>
                        {t('clg.page.create.config.keyvalues.description')}
                    </div>
                </div>
                <ClgKeyValueFields handleChange={this.handleKeyvalueFieldsChange} renderValuesAsSecret={true} />
            </div>
        );
    }

    private closeNotification() {
        this.setState({ error: undefined });
    }

    private checkInputFieldValidity() {
        let hasInvalidFields = false;
        let hasEmptyFields = false;  // empty (but required AND NOT invalid) fields are considered to be fields that were intentionally left blank at the beginning!

        if (
            this.state.secretName.invalid ||
            this.state.keyvalueFields.invalid) {

            hasInvalidFields = true;
        }

        if (!this.state.secretName.val) {
            hasEmptyFields = true;
        }

        if (hasInvalidFields ||
            hasEmptyFields) {
            this.setIsCreateDisabled();
        } else {
            this.unsetIsCreateDisabled();
        }

        return hasInvalidFields;
    }

    private setIsCreateDisabled() {
        if (this.props.onCreateDisabledChanged) {
            this.props.onCreateDisabledChanged(IConfigTypes.SECRET, true);
        }

        this.setState({
            isCreateDisabled: true,
        });
    }

    private setIsCreating() {
        if (this.props.onIsCreatingChanged) {
            this.props.onIsCreatingChanged(IConfigTypes.SECRET, true);
        }

        this.setState({
            isCreating: true,
        });
    }

    private unsetIsCreateDisabled() {
        if (this.props.onCreateDisabledChanged) {
            this.props.onCreateDisabledChanged(IConfigTypes.SECRET, false);
        }

        this.setState({
            isCreateDisabled: false,
        });
    }

    private unsetIsCreating() {
        if (this.props.onIsCreatingChanged) {
            this.props.onIsCreatingChanged(IConfigTypes.SECRET, false);
        }

        this.setState({
            isCreating: false,
        });
    }

    private handleCancel() {
        this.logger.debug('handleCancel');
        this.props.history.goBack();
    }

    private handleSecretNameChange(event) {
        if (event.target) {
            const val = event.target.value;
            this.setState((oldState) => {
                oldState.secretName.val = val;
                validateField(oldState.secretName);
                return oldState;
            }, () => {
                this.checkInputFieldValidity();
                this.closeNotification();
            });
        }
    }

    private handleKeyvalueFieldsChange(keyvalueFields: IClgKeyValueFields): void {
        if (keyvalueFields) {
            this.setState((oldState) => {
                oldState.keyvalueFields.val = keyvalueFields.val;
                oldState.keyvalueFields.invalid = keyvalueFields.invalid;
                return oldState;
            }, () => {
                this.checkInputFieldValidity();
            });
        }
    }

    private convertKeyvalueFields(keyvalueFields: IClgKeyValueFields): configModel.IUIKeyValue[] {
        const keyValuePairs: configModel.IUIKeyValue[] = [];
        if (keyvalueFields && keyvalueFields.val && Array.isArray(keyvalueFields.val) && keyvalueFields.val.length > 0) {
            for (const keyValuePair of keyvalueFields.val) {
                keyValuePairs.push({
                    key: keyValuePair.name.val,
                    value: keyValuePair.value.val,
                });
            }
        }
        return keyValuePairs;
    }

    private createNewGenericSecret() {
        const fn = 'createNewGenericSecret ';
        this.logger.debug(`${fn}>`);

        this.setIsCreating();

        // build the secret that shall be created
        const secretToCreate: configModel.IUIGenericSecret = {
            data: this.convertKeyvalueFields(this.state.keyvalueFields),
            id: this.state.secretName.val,
            kind: UIEntityKinds.SECRET,
            name: this.state.secretName.val,
            regionId: undefined,
            type: 'Generic',
        };

        // create the secret using a thin client-side API layer
        secretApi.createSecret(this.props.selectedProject.region,
            this.props.selectedProject.id,
            secretToCreate)
            .then((result: configModel.IUISecret) => {
                this.logger.debug(`${fn}result: '${configModel.stringify(result)}'`);

                // hide the loading animation
                this.unsetIsCreating();

                // show a toast notification
                const successNotification: viewCommonModel.IClgToastNotification = {
                    kind: 'success',
                    subtitle: t('clg.page.create.config.secret.success.subtitle', { name: result.name }),
                    title: t('clg.page.create.config.secret.success.title'),
                };
                toastNotification.add(successNotification);

                // navigate to newly create JobDefinition details page
                this.props.history.push(nav.toProjectDetailConfig(this.props.selectedProject.region, this.props.selectedProject.id));
            }).catch((requestError: UIRequestError) => {
                this.logger.warn(`${fn}- An error occurred during generic secret creation: '${JSON.stringify(requestError)}'`);

                if (requestError.error && requestError.error.name === 'FailedToCreateSecretBecauseAlreadyExistsError') {
                    // invalidate the secretName
                    const secretName = this.state.secretName;
                    secretName.invalid = 'EXISTS';

                    // set the inline notification
                    const secretExistsNotification: viewCommonModel.IClgInlineNotification = {
                        kind: 'error',
                        subtitle: t('clg.page.create.config.secret.error.secretExists.desc', { name: this.state.secretName.val }),
                        title: t('clg.page.create.config.secret.error.secretExists.title'),
                    };
                    this.setState({ error: secretExistsNotification, isCreating: false, isCreateDisabled: true, secretName });
                } else {

                    // in case the response could not be mapped to a specific creation error, we should use a generic one
                    const errorNotification: viewCommonModel.IClgInlineNotification = {
                        // clgId: requestError.clgId,
                        kind: 'error',
                        title: t('clg.page.create.config.secret.error.creationFailed.title'),
                    };
                    this.setState({ error: errorNotification, isCreating: false });
                }

                // scroll to the top of the page
                window.scrollTo(0, 0);

                this.unsetIsCreating();
            });
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
CreateGenericSecretSubpage.propTypes = {
    history: PropTypes.shape({
        goBack: PropTypes.func,
        push: PropTypes.func,
    }),
};

export { CreateGenericSecretSubpage };
