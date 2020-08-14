// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// pal + carbon
import { Button, } from '@console/pal/carbon-components-react';

import * as configModel from '../../../../common/model/config-model';
import * as projectModel from '../../../../common/model/project-model';
import * as coligoValidatorConfig from '../../../../common/validator/coligo-validator-config';
import * as commonValidator from '../../../../common/validator/common-validator';
import { TextValidator } from '../../../../common/validator/text-validator';
import flagsApi from '../../../api/flags';
import t from '../../../utils/i18n';
import ClgContainerImageSelectorSidePanel from '../../components/ClgContainerImageSelectorSidePanel/ClgContainerImageSelectorSidePanel';
import * as viewCommonModel from '../../model/common-view-model';
import ClgTextInput from '../ClgTextInput/ClgTextInput';

interface IProps {
    allowToUsePublicRegistry: boolean;
    disabled?: boolean;
    hasHelperText?: boolean;
    idPrefix: string;
    image?: commonValidator.IClgTextField;
    isEditMode?: boolean;
    nlsKeyPrefix: string;
    onChange: (event: any) => void;
    project: projectModel.IUIProject;
    registryName?: string;
    light?: boolean;
}

interface IState {
    error?: viewCommonModel.IClgInlineNotification;
    image?: commonValidator.IClgTextField;
    isPrivateContainerRegistryEnabled: boolean;
    isContainerImageSelectorSidePanelOpen: boolean;
    ownUpdate?: boolean;
    selectedRegistry?: configModel.IUIRegistrySecret;
    registryName?: string;
}

interface IStateUpdate {
    disabled?: boolean;
    image?: commonValidator.IClgTextField;
    registryName?: string;
    ownUpdate: boolean;
}

const COMPONENT = 'ClgContainerImage';
// setup the logger
const logger = log.getLogger(COMPONENT);

class ClgContainerImage extends React.Component<IProps, IState> {
    public static getDerivedStateFromProps(props: IProps, state: IState) {
        const fn = 'getDerivedStateFromProps ';
        logger.trace(`${fn}> props: '${JSON.stringify(props)}', state: ${JSON.stringify(state)}`);

        if (props.isEditMode || state.ownUpdate || state.isContainerImageSelectorSidePanelOpen) {
            logger.debug(`${fn}< - no updated due to edit mode or own update`);
            return { ownUpdate: false };
        }

        const stateUpdate: IStateUpdate = { ownUpdate: false };

        // check whether the image has been updated
        if (!state.image || state.image.val !== props.image.val) {
            stateUpdate.image = props.image;
        }

        // check whether the registryName has been updated
        if (!state.registryName || state.registryName !== props.registryName) {
            stateUpdate.registryName = props.registryName;
        }

        // check whether the registryName and the selectedRegistry are out-of-sync
        if (props.registryName !== (state.selectedRegistry && state.selectedRegistry.name)) {
            stateUpdate.registryName = props.registryName;
        }

        // check whether the state needs to be updated
        if (Object.keys(stateUpdate).length > 1) {
            logger.debug(`${fn}< state update! ${JSON.stringify(stateUpdate)}`);
            return stateUpdate;
        }

        logger.debug(`${fn}<`);
        return null;
    }

    private readonly RULES_IMAGE: commonValidator.IClgTextFieldRules = coligoValidatorConfig.default.common.image;
    private readonly textValidator: commonValidator.IClgFieldValidator = new TextValidator();

    constructor(props) {
        super(props);

        this.state = {
            image: props.image || { val: '' },
            isPrivateContainerRegistryEnabled: false, // temporary state (can be removed once this is rolled-out to production)
            isContainerImageSelectorSidePanelOpen: false,
            ownUpdate: false,
            registryName: props.registryName,
        };

        this.populateChangesToParent = this.populateChangesToParent.bind(this);
        this.onImageChange = this.onImageChange.bind(this);
        this.onContainerImageSelected = this.onContainerImageSelected.bind(this);

        // create container image selector sidepanel
        this.openContainerImageSelectorSidePanel = this.openContainerImageSelectorSidePanel.bind(this);
        this.closeContainerImageSelectorSidePanel = this.closeContainerImageSelectorSidePanel.bind(this);
    }

    public componentDidMount() {
        const fn = 'componentDidMount ';
        logger.debug(`${fn}>`);

        // check whether we show private container registry support
        flagsApi.getFlag(flagsApi.flags.FEATURE_CONTAINER_REGISTRIES, (flag) => {
            logger.debug(`${fn}- evaluated feature flag '${JSON.stringify(flag)}'`);
            if (flag && flag.value === true) {
                this.setState({ isPrivateContainerRegistryEnabled: true, ownUpdate: true });
            }
        });

    }

    public openContainerImageSelectorSidePanel() {
        logger.debug('openContainerImageSelectorSidePanel');
        this.setState({ isContainerImageSelectorSidePanelOpen: true, ownUpdate: true, });
    }

    public closeContainerImageSelectorSidePanel() {
        logger.debug('closeContainerImageSelectorSidePanel');
        this.setState({ isContainerImageSelectorSidePanelOpen: false, ownUpdate: true, });
    }

    public onImageChange(event) {
        const fn = 'onImageChange ';
        logger.debug(`${fn}> event: '${event.target.value}'`);
        if (event.target) {
            const field: commonValidator.IClgTextField = commonValidator.getValidatedTextField(event.target.value, this.textValidator, this.RULES_IMAGE);

            this.populateChangesToParent(field, this.state.selectedRegistry);
        }

        logger.debug(`${fn}<`);
    }

    public onContainerImageSelected(selection) {
        const fn = 'onContainerImageSelected ';
        logger.debug(`${fn}> event: '${JSON.stringify(selection)}'`);

        // extract the image and the registry information
        const selectedImage: commonValidator.IClgTextField = commonValidator.getValidatedTextField(selection.image, this.textValidator, this.RULES_IMAGE);
        const selectedRegistry = selection.registry;

        // close the sidepane
        this.closeContainerImageSelectorSidePanel();

        // populate all changes to the parent
        this.populateChangesToParent(selectedImage, selectedRegistry);
        logger.debug(`${fn}<`);
    }

    public render() {
        logger.debug(`render - image: ${this.state.image && this.state.image.val}, registryName: '${this.state.registryName}', selectedRegistry: ${JSON.stringify(this.state.selectedRegistry && this.state.selectedRegistry.name)}`);
        return (
            <div className='clg-container-image'>
                <div className='bx--row'>
                    <div className={this.state.isPrivateContainerRegistryEnabled ? 'bx--col-max-10 bx--col-xlg-10 bx--col-lg-8 bx--col-md-4 bx--col-sm-4' : 'bx--col-max-16 bx--col-lg-16 bx--col-md-8 bx--col-sm-4'}>
                        <ClgTextInput
                            hasHelperText={!!this.props.hasHelperText}
                            hasPlaceholderText={true}
                            hasTooltip={true}
                            hasTooltipFooter={true}
                            inputId={`${this.props.idPrefix}-image`}
                            isDisabled={this.props.disabled}
                            nlsKey={`${this.props.nlsKeyPrefix}.image`}
                            onChange={this.onImageChange}
                            textField={this.state.image}
                            validationRules={this.RULES_IMAGE}
                            light={!!this.props.light}
                        />
                    </div>
                    {this.state.isPrivateContainerRegistryEnabled && (
                        <div className={`select-image bx--col-max-6 bx--col-xlg-6 bx--col-lg-8 bx--col-md-2 bx--col-sm-4 ${!!this.props.hasHelperText ? ' has-helpertext' : ' '}`}>
                            <Button
                                id={'select-image-btn'}
                                kind='tertiary'
                                disabled={this.props.disabled}
                                size={'field'}
                                onClick={this.openContainerImageSelectorSidePanel}
                            >
                                {t('clg.cmp.containerimage.action.selectimage')}
                            </Button>
                            <ClgContainerImageSelectorSidePanel
                                allowInputDerivation={!!!this.props.isEditMode}
                                allowToUsePublicRegistry={false}
                                image={this.state.image}
                                open={this.state.isContainerImageSelectorSidePanelOpen}
                                onClose={this.closeContainerImageSelectorSidePanel}
                                onChange={this.onContainerImageSelected}
                                project={this.props.project}
                                registryName={this.state.registryName}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    private shouldDisableSave(
        image: commonValidator.IClgTextField,
        selectedRegistry: configModel.IUIRegistrySecret): boolean {

        const fn = 'shouldDisableSave ';
        logger.debug(`${fn}>`);

        const allFieldsAreValid = image && !image.invalid;

        if (!allFieldsAreValid &&
            image.val) {
            // disable the create button
            logger.debug(`${fn}< true`);
            return true;
        }

        logger.debug(`${fn}< false`);
        return false;
    }

    /**
     * This function is used to populate the current state to the parent component
     */
    private populateChangesToParent(image: commonValidator.IClgTextField, selectedRegistry: configModel.IUIRegistrySecret) {
        const fn = 'populateChangesToParent ';
        logger.debug(`${fn}>`);

        // evaluate whether the save button must be disabled
        const shouldDisableSaveBtn = this.shouldDisableSave(image, selectedRegistry);

        if (this.state.image.val === image.val && (selectedRegistry.name === this.props.registryName)) {
            logger.debug(`${fn}< - skip populating the information`);
            return;
        }

        this.setState({
            image,
            ownUpdate: true,
            selectedRegistry,
        }, () => {
            this.props.onChange({
                image,
                invalid: shouldDisableSaveBtn ? `${shouldDisableSaveBtn}` : undefined,
                registry: selectedRegistry,
            });
        });

        logger.debug(`${fn}<`);
    }
}
// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgContainerImage.propTypes = {
    allowToUsePublicRegistry: PropTypes.bool.isRequired,
    disabled: PropTypes.bool,
    hasHelperText: PropTypes.bool,
    idPrefix: PropTypes.string.isRequired,
    image: PropTypes.object,
    isEditMode: PropTypes.bool,
    nlsKeyPrefix: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    project: PropTypes.object,
    registryName: PropTypes.string,
};

export default ClgContainerImage;
