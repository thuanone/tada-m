// react
import PropTypes from 'prop-types';
import React from 'react';
import { withRouter } from 'react-router-dom';

// carbon + pal
import { Add16, Close16, Save16 } from '@carbon/icons-react';
import { Button, InlineLoading, InlineNotification, Tab, Tabs } from '@console/pal/carbon-components-react';
import { Card, CardBody, CardHeader } from '@console/pal/Components';

// 3rd-party
import { cloneDeep } from 'lodash';
import * as log from 'loglevel';

// coligo
import { IUIBuild, IUIBuildRun, IUIEditBuild, } from '../../../../../common/model/build-model';
import * as commonModel from '../../../../../common/model/common-model';
import * as projectModel from '../../../../../common/model/project-model';
import coligoValidatorConfig from '../../../../../common/validator/coligo-validator-config';
import {
    getValidatedTextField,
} from '../../../../../common/validator/common-validator';
import { TextValidator } from '../../../../../common/validator/text-validator';
import * as buildApi from '../../../../api/build-api';
import t from '../../../../utils/i18n';
import clgContainerRegistryName from '../../../../utils/formatter/clgContainerRegistryName';
import toastNotification from '../../../../utils/toastNotification';
import ClgBuildRunDetailsTable from '../../../components/ClgBuildRunDetailsTable/ClgBuildRunDetailsTable';
import ClgConfirmationModal from '../../../components/ClgConfirmationModal/ClgConfirmationModal';
import {
    IViewBuildOutput,
    IViewBuildSource,
    IViewBuildStrategy,
} from '../../../model/build-view-model';
import * as viewCommonModels from '../../../model/common-view-model';
import { IClgToastNotification } from '../../../model/common-view-model';
import BuildDetailTabOutput from '../BuildDetailTabOutput/BuildDetailTabOutput';
import BuildDetailTabSource from '../BuildDetailTabSource/BuildDetailTabSource';
import BuildDetailTabStrategy from '../BuildDetailTabStrategy/BuildDetailTabStrategy';

interface IProps {
    history: any;
    build: IUIBuild;
    onResetBuild: () => void;
    onUpdateBuild: (updatedJobDef: IUIBuild) => void;
    project?: projectModel.IUIProject;
}

interface IState {
    activeTab: number;
    error: viewCommonModels.IClgInlineNotification;
    hasInvalidData: boolean;
    isBuildRunCreationModalOpen: boolean;
    isCreatingBuildRun: boolean;
    isSaving: boolean;
    unsavedChanges: {
        [key: string]: boolean
    };
    buildModifications?: IUIEditBuild;
    outputTabInput?: IViewBuildOutput;
    project?: projectModel.IUIProject;
    sourceTabInput?: IViewBuildSource;
    strategyTabInput?: IViewBuildStrategy;
}

const GlobalTextValidator = new TextValidator();

class BuildDetailConfiguration extends React.Component<IProps, IState> {
    public static getDerivedStateFromProps(props: IProps, state: IState) {
        if (!state.buildModifications) {

            return {
                outputTabInput: {
                    outputRegistry: props.build.outputCredentials && {name : props.build.outputCredentials},
                    outputImage: getValidatedTextField(props.build.outputImage, GlobalTextValidator, coligoValidatorConfig.build.outputImage, true),
                },
                project: props.project,
                sourceTabInput: {
                    sourceUrl: getValidatedTextField(props.build.sourceUrl, GlobalTextValidator, coligoValidatorConfig.build.sourceUrl, true),
                    sourceRev: getValidatedTextField(props.build.sourceRev, GlobalTextValidator, coligoValidatorConfig.build.sourceRev, true),
                },
                strategyTabInput: {
                    strategyName: getValidatedTextField(props.build.strategyName, GlobalTextValidator, coligoValidatorConfig.build.strategyName, true),
                },
                unsavedChanges: {},
            };
        } else {
            return null;
        }
    }

    private readonly regionId: string;
    private readonly projectId: string;
    private readonly buildId: string;

    private readonly COMPONENT = 'BuildDetailConfiguration';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    private cacheUpdateFn;

    constructor(props) {
        super(props);

        this.regionId = props.match.params.regionId;
        this.projectId = props.match.params.projectId;
        this.buildId = props.match.params.buildId;

        this.state = {
            activeTab: 0,
            error: undefined,
            hasInvalidData: false,
            isBuildRunCreationModalOpen: false,
            isCreatingBuildRun: false,
            isSaving: false,
            project: props.project,
            unsavedChanges: {},
        };

        // binding all callback functions to this, in order to enable setState and this.state
        this.askToConfirmBuildRunCreation = this.askToConfirmBuildRunCreation.bind(this);
        this.closeNotification = this.closeNotification.bind(this);
        this.dismissUnsavedChanges = this.dismissUnsavedChanges.bind(this);
        this.getCacheUpdateFn = this.getCacheUpdateFn.bind(this);
        this.handleUserUpdates = this.handleUserUpdates.bind(this);
        this.handleModalCancel = this.handleModalCancel.bind(this);
        this.getUnsavedChangesConditionalMarkup = this.getUnsavedChangesConditionalMarkup.bind(this);
        this.createBuildRun = this.createBuildRun.bind(this);
        this.hasAnyUnsavedChanges = this.hasAnyUnsavedChanges.bind(this);
        this.onSelectTab = this.onSelectTab.bind(this);
        this.saveUpdatedBuild = this.saveUpdatedBuild.bind(this);
        this.updateValuesFromOutputTab = this.updateValuesFromOutputTab.bind(this);
        this.updateValuesFromSourceTab = this.updateValuesFromSourceTab.bind(this);
        this.updateValuesFromStrategyTab = this.updateValuesFromStrategyTab.bind(this);
        this.buildBuildForSaving = this.buildBuildForSaving.bind(this);
        this.hasValidBuildModifications = this.hasValidBuildModifications.bind(this);
        this.onError = this.onError.bind(this);
    }

    public render() {
        this.logger.debug(`render > hasUnsavedChanges? ${this.hasAnyUnsavedChanges()}`);

        const isInEditMode = this.hasAnyUnsavedChanges();
        return (
            <div className='clg-build-detail-page--configuration'>
                <div>
                    <div className='bx--row'>
                        <div className='bx--col-xlg-8 bx--col-lg-8 bx--col-md-8 bx--col-sm-4 clg-card-container'>
                            <Card>
                                <CardHeader
                                    className='clg-card-header'
                                    small={true}
                                    title={t('clg.nav.build.configuration')}
                                >
                                    {isInEditMode &&
                                        (
                                            <React.Fragment>
                                                <div className='actions-btns'>
                                                    <Button id={'cancel-changes-btn'} kind='secondary' disabled={this.state.isSaving} size='small' renderIcon={Close16} onClick={this.dismissUnsavedChanges}>{t('clg.common.label.cancel')}</Button>
                                                    {this.state.isSaving ?
                                                        (
                                                            <InlineLoading status='active' description={t('clg.page.build.loading.saveBuild')} />
                                                        ) : (
                                                            <Button id={'save-changes-btn'} kind='primary' disabled={this.state.isSaving || !this.hasValidBuildModifications() || this.state.isCreatingBuildRun} size='small' renderIcon={Save16} onClick={this.saveUpdatedBuild}>{t('clg.common.label.save')}</Button>
                                                        )}
                                                </div>
                                            </React.Fragment>
                                        )}
                                </CardHeader>
                                <CardBody>
                                    {this.state.error &&
                                        (
                                            <InlineNotification
                                                kind={this.state.error.kind}
                                                lowContrast={true}
                                                title={this.state.error.title}
                                                subtitle={(<span>{t(this.state.error.subtitle)}</span>)}
                                                onCloseButtonClick={this.closeNotification}
                                            />
                                        )}
                                    <div className='section configuration-tabs'>
                                        <Tabs type='container' className={'build-tabs clg-full-width-tabnav '} tabContentClassName={'build-section--content'} onSelectionChange={this.onSelectTab} aria-label='configuration tabs'>
                                            <Tab
                                                aria-label={t('clg.page.build.tab.source')}
                                                id={'build-tab-source'}
                                                tabIndex={0}
                                                label={(<span>{this.getUnsavedChangesConditionalMarkup('source')}{t('clg.page.build.tab.source')}</span>)}
                                                className={'build-tab-source'}
                                            >
                                                <BuildDetailTabSource
                                                    allowInputDerivation={!this.state.buildModifications}
                                                    handleChange={this.handleUserUpdates}
                                                    inputValues={this.state.sourceTabInput}
                                                />
                                            </Tab>
                                            <Tab
                                                aria-label={t('clg.page.build.tab.strategy')}
                                                id={'build-tab-strategy'}
                                                tabIndex={1}
                                                label={(<span>{this.getUnsavedChangesConditionalMarkup('strategy')}{t('clg.page.build.tab.strategy')}</span>)}
                                            >
                                                <BuildDetailTabStrategy
                                                    allowInputDerivation={!this.state.buildModifications}
                                                    handleChange={this.handleUserUpdates}
                                                    inputValues={this.state.strategyTabInput}
                                                />
                                            </Tab>
                                            <Tab
                                                aria-label={t('clg.page.build.tab.output')}
                                                id={'build-tab-output'}
                                                tabIndex={2}
                                                label={(<span>{this.getUnsavedChangesConditionalMarkup('output')}{t('clg.page.build.tab.output')}</span>)}
                                            >
                                                <BuildDetailTabOutput
                                                    allowInputDerivation={!this.state.buildModifications}
                                                    handleChange={this.handleUserUpdates}
                                                    inputValues={this.state.outputTabInput}
                                                    project={this.state.project}
                                                />
                                            </Tab>
                                        </Tabs>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                        <div className='bx--col-xlg-8 bx--col-lg-8 bx--col-md-8 bx--col-sm-4 clg-card-container buildrun-list-card'>
                            <Card>
                                <CardHeader
                                    className='clg-card-header'
                                    small={true}
                                    title={t('clg.page.build.section.buildRuns')}
                                >
                                    <div className='actions-btns'>
                                        <Button kind='primary' disabled={isInEditMode || this.state.isCreatingBuildRun} size='small' onClick={this.askToConfirmBuildRunCreation} renderIcon={Add16} className={'create-buildrun-btn'}>{t('clg.page.build.action.create-buildrun')}</Button>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <div className='section buildrun-list'>
                                        <div className='build-section--content no-pad-left'>
                                            <ClgBuildRunDetailsTable
                                                buildName={this.props.build.name}
                                                getUpdateCacheFnRef={this.getCacheUpdateFn}
                                                history={this.props.history}
                                                regionId={this.regionId}
                                                projectId={this.projectId}
                                                errorHandler={this.onError}
                                            />
                                        </div>
                                    </div>
                                </CardBody>
                                <ClgConfirmationModal
                                    id={'confirm-buildrun-creation-modal'}
                                    isDanger={false}
                                    isSubmitting={this.state.isCreatingBuildRun}
                                    onSubmitHandler={this.createBuildRun}
                                    onCancelHandler={this.handleModalCancel}
                                    heading={t('clg.modal.buildrun.create.title')}
                                    isOpen={this.state.isBuildRunCreationModalOpen}
                                    primaryBtnText={t('clg.modal.buildrun.create.ok')}
                                    secondaryBtnText={t('clg.modal.button.cancel')}
                                    messages={[t('clg.modal.buildrun.create.message', {name: this.props.build.name})]}
                                />
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    private askToConfirmBuildRunCreation() {
        this.setState({ isBuildRunCreationModalOpen: true });
    }

    private handleModalCancel() {
        this.setState({ isBuildRunCreationModalOpen: false });
    }

    private getCacheUpdateFn(fn) {
        this.cacheUpdateFn = fn;
    }

    private closeNotification() {
        this.setState({ error: undefined });
    }

    private onError(error) {
        this.logger.warn('ERROR received from BuildRun Table component', error);
    }

    private onSelectTab(tabIndex: number) {
        this.logger.debug('onSelectTab - Active Tab: ' + tabIndex);
        this.setState({
            activeTab: tabIndex,
        });
    }

    private updateValuesFromOutputTab(buildMods: IUIEditBuild, updatedValues: IViewBuildOutput) {
        buildMods.outputImage = updatedValues.outputImage;
        buildMods.outputRegistry = updatedValues.outputRegistry;
    }

    private updateValuesFromSourceTab(buildMods: IUIEditBuild, updatedValues: IViewBuildSource) {
        buildMods.sourceUrl = updatedValues.sourceUrl;
    }

    private updateValuesFromStrategyTab(buildMods: IUIEditBuild, updatedValues: IViewBuildStrategy) {
        buildMods.strategyName = updatedValues.strategyName;
    }

    private getUnsavedChangesConditionalMarkup(tab: string): React.ReactFragment {
        return (
            <React.Fragment>
                {this.state.unsavedChanges && this.state.unsavedChanges[tab] &&
                    <span className='unsaved-changes'>&nbsp;</span>
                }
            </React.Fragment>
        );
    }

    private hasAnyUnsavedChanges(): boolean {
        for (const [key, value] of Object.entries(this.state.unsavedChanges)) {
            if (value === true) {
                return true;
            }
        }
        return false;
    }

    /**
     * This functions receives update events from child components.
     * In case a new update comes in, this component ensures that unsaved changes state (see tabs) is set.
     * Additionally, this function ensures that the overall page state is kept up-to-date.
     * @param {string} sourceType - the source where the update was received from (either: 'source', 'strategy' or 'limits')
     * @param {*} updatedValues - an map that contains all updates that were made. this object will be merged into the page state
     */
    private handleUserUpdates(sourceType, updatedValues) {
        const fn = 'handleUserUpdates ';
        this.logger.debug(`${fn}- ${sourceType} - updates: '${JSON.stringify(updatedValues)}'`);

        let buildMods = this.state.buildModifications;

        if (!buildMods) {
            // create a new buildModificationsObject
            buildMods = {
                outputRegistry: this.state.outputTabInput.outputRegistry,
                outputImage: this.state.outputTabInput.outputImage,
                sourceUrl: this.state.sourceTabInput.sourceUrl,
                sourceRev: this.state.sourceTabInput.sourceRev,
                strategyName: this.state.strategyTabInput.strategyName,
            };
        }

        if (updatedValues && sourceType === 'output') {
            this.updateValuesFromOutputTab(buildMods, updatedValues);
        }

        if (updatedValues && sourceType === 'source') {
            this.updateValuesFromSourceTab(buildMods, updatedValues);
        }

        if (updatedValues && sourceType === 'strategy') {
            this.updateValuesFromStrategyTab(buildMods, updatedValues);
        }

        const unsavedChanges = this.state.unsavedChanges;
        unsavedChanges[sourceType] = true;

        this.setState({
            buildModifications: buildMods,
            unsavedChanges,
        });
    }

    private dismissUnsavedChanges() {
        const fn = 'dismissUnsavedChanges ';
        this.logger.debug(`${fn}> `);

        this.setState({
            buildModifications: undefined,
            unsavedChanges: {},
        }, () => {
            if (this.props.onResetBuild) {
                this.props.onResetBuild();
            }
        });

        this.logger.debug(`${fn}<`);
    }

    /**
     * Uses this.state.buildModifications data to build an IUIBuild object that can be
     * sent to updateBuild() api call
     */
    private buildBuildForSaving(): IUIBuild {
        const buildForSaving: IUIBuild = cloneDeep(this.props.build);

        // now apply all modifications
        const buildMods = this.state.buildModifications;

        if (buildMods) {
            buildForSaving.sourceUrl = buildMods.sourceUrl.val;
            buildForSaving.sourceRev = buildMods.sourceRev.val;
            buildForSaving.strategyName = buildMods.strategyName.val;
            buildForSaving.outputCredentials = clgContainerRegistryName.isDummRegistry(buildMods.outputRegistry) ? undefined : buildMods.outputRegistry.name;
            buildForSaving.outputImage = buildMods.outputImage.val;
        }

        return buildForSaving;
    }

    /**
     * Returns true, if the current build modifications are ok from a validation standpoint and can be
     * used to build a valid update API request.
     */
    private hasValidBuildModifications() {
        const fn = 'hasValidBuildModifications ';
        this.logger.debug(`${fn}>`);
        // walk through the whole modifications object and check for any defined 'invalid' fields
        let result = true;

        const buildMods = this.state.buildModifications;

        if (buildMods) {
            if (buildMods.sourceUrl.invalid) {
                result = false;
                this.logger.debug(`${fn}- sourceUrl is invalid`);
            }

            if (buildMods.strategyName.invalid) {
                result = false;
                this.logger.debug(`${fn}- strategyName is invalid`);
            }

            if (buildMods.outputImage.invalid) {
                result = false;
                this.logger.debug(`${fn}- outputImage is invalid`);
            }

            if (!buildMods.outputRegistry || buildMods.outputRegistry.name === '') {
                result = false;
                this.logger.debug(`${fn}- outputRegistry is invalid`);
            }
        } else {
            // if no buildMods are present, we should also not send an update request, as there are no updates available
            result = false;
            this.logger.debug(`${fn}- buildMods not set`);
        }

        this.logger.debug(`${fn}< ${result}`);
        return result;
    }

    private saveUpdatedBuild() {
        const fn = 'saveUpdatedBuild ';
        this.logger.debug(`${fn}>`);

        // show the loading animation
        this.setState({ isSaving: true, isBuildRunCreationModalOpen: false });

        buildApi.updateBuild(this.regionId, this.projectId, this.buildBuildForSaving())
            .then((updatedJobDef: IUIBuild) => {

                // show a toast notification
                const successNotification: IClgToastNotification = {
                    kind: 'success',
                    subtitle: t('clg.page.build.success.updatingBuild.subtitle', { name: updatedJobDef.name }),
                    title: t('clg.page.build.success.updatingBuild.title'),
                };
                toastNotification.add(successNotification);

                this.setState({
                    buildModifications: undefined,
                    isSaving: false,
                    unsavedChanges: {},
                }, () => {
                    if (this.props.onUpdateBuild) {
                        this.props.onUpdateBuild(updatedJobDef);
                    }
                });
                this.logger.debug(`${fn}< SUCCESS`);
            })
            .catch((requestError: commonModel.UIRequestError) => {
                this.logger.error(`${fn}- failed to save Build - error message: ${requestError.message}`, requestError);

                this.setState({ isSaving: false });

                // show a toast notification
                const errorNotification: IClgToastNotification = {
                    kind: 'error',
                    subtitle: t('clg.page.build.error.updatingBuild.subtitle', { name: this.props.build.name }),
                    title: t('clg.page.build.error.updatingBuild.title'),
                };
                toastNotification.add(errorNotification);
                this.logger.debug(`${fn}< FAILED`);
            });
    }

    private createBuildRun() {
        this.logger.debug('createBuildRun >');

        this.setState({
            isBuildRunCreationModalOpen: false,
            isCreatingBuildRun: true,
        });

        // build the actual BuildRun
        const buildRunToCreate: IUIBuildRun = {
            buildRef: this.props.build.name,
            id: undefined,
            kind: commonModel.UIEntityKinds.BUILDRUN,
        };

        buildApi.createBuildRun(this.regionId, this.projectId, buildRunToCreate)
            .then((createdResult: IUIBuildRun) => {
                // show a toast notification
                const successNotification: IClgToastNotification = {
                    caption: t('clg.page.build.success.createBuildRun.caption'),
                    kind: 'success',
                    subtitle: t('clg.page.build.success.createBuildRun.subtitle'),
                    title: t('clg.page.build.success.createBuildRun.title'),
                };
                toastNotification.add(successNotification);

                // hide the loading animation
                this.setState({
                    isCreatingBuildRun: false,
                }, () => {

                    // update the cache for buildruns of this build after a short delay
                    if (this.cacheUpdateFn) {
                        setTimeout(this.cacheUpdateFn, 500);
                    }
                });
                this.logger.debug('createBuildRun <');
            })
            .catch((errorResult: commonModel.UIRequestError) => {
                this.logger.warn(`createJobRun - Failed to create buildrun - message: ${errorResult.message}`);

                // show a toast error notification
                const buildRunErrorNotification: IClgToastNotification = {
                    kind: 'error',
                    subtitle: t('clg.page.build.error.createBuildRun.subtitle'),
                    title: t('clg.page.build.error.createBuildRun.title'),
                };
                toastNotification.add(buildRunErrorNotification);

                // hide the loading animation
                this.setState({
                    isCreatingBuildRun: false,
                });
                this.logger.debug('createBuildRun < FAILED');
            });
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
BuildDetailConfiguration.propTypes = {
    build: PropTypes.object.isRequired,
    match: PropTypes.shape({
        params: PropTypes.shape({
            buildId: PropTypes.string.isRequired,
            projectId: PropTypes.string.isRequired,
            regionId: PropTypes.string.isRequired,
        }),
    }),
    onResetBuild: PropTypes.func,
    onUpdateBuild: PropTypes.func,
    project: PropTypes.object,
};

export { BuildDetailConfiguration };
export default withRouter(BuildDetailConfiguration);
