import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// pal + carbon
import { Add16, } from '@carbon/icons-react';
import { Button, Dropdown, DropdownSkeleton, FormItem, FormLabel, InlineNotification, NotificationActionButton } from '@console/pal/carbon-components-react';

import * as commonModel from '../../../../common/model/common-model';
import * as configModel from '../../../../common/model/config-model';
import * as projectModel from '../../../../common/model/project-model';
import cache from '../../../utils/cache';
import t from '../../../utils/i18n';
import clgContainerRegistryName from '../../../utils/formatter/clgContainerRegistryName';
import { IClgInlineNotification } from '../../model/common-view-model';

interface IProps {
    addRegistryFn: () => void;
    allowToUsePublicRegistry?: boolean;
    disabled?: boolean;
    onGetReloadFn?: (reloadFn) => void;
    light?: boolean;
    onError: (error) => any;
    onSelect: (registry: configModel.IUIRegistrySecret) => any;
    project: projectModel.IUIProject;
    selectedRegistryName?: string;
    showAddBtn?: boolean;
}

interface IState {
    emptyStateNotification?: IClgInlineNotification;
    error?: IClgInlineNotification;
    failedToListRegistries?: string;
    isLoading: boolean;
    registries?: any[];
    selectedRegistry?: configModel.IUIRegistrySecret;
    selectedRegistryName?: string;
}

class ClgRegistrySelector extends React.Component<IProps, IState> {
    private readonly COMPONENT = 'ClgRegistrySelector';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    private readonly REGISTRIES_CACHE_NAME = 'coligo-registries';
    private cacheIdProject: string;

    private removeCacheListener: () => any;

    constructor(props) {
        super(props);

        this.closeEmptyStateNotification = this.closeEmptyStateNotification.bind(this);
        this.handleRegistriesChange = this.handleRegistriesChange.bind(this);
        this.itemToString = this.itemToString.bind(this);
        this.loadRegistries = this.loadRegistries.bind(this);
        this.onRegistriesLoaded = this.onRegistriesLoaded.bind(this);
        this.onRegistriesLoadingFailed = this.onRegistriesLoadingFailed.bind(this);

        // populate the load registries function to the parent
        props.onGetReloadFn(this.loadRegistries);

        if (props.project) {
            this.cacheIdProject = `region/${props.project.region}/project/${props.project.id}`;
        }

        this.state = {
            isLoading: true,
            registries: [],
            selectedRegistry: undefined,
            selectedRegistryName: props.selectedRegistryName,
        };
    }

    public componentDidMount() {
        this.logger.debug('componentDidMount');

        if (this.props.project) {
            this.loadRegistries();
        }
    }

    public componentWillUnmount() {
        if (this.removeCacheListener) {
            // remove the cache listener in order to avoid background syncs with the backend
            this.removeCacheListener();
        }
    }

    public UNSAFE_componentWillReceiveProps(newProps) {
        const fn = 'componentWillReceiveProps ';
        this.logger.debug(`${fn}- props.disabled: '${this.props.disabled}', props.selectedRegistryName: '${newProps.selectedRegistryName}', props.disabled: '${newProps && newProps.disabled}', props.project: ${projectModel.stringify(newProps && newProps.project)}`);

        if (!this.props.project && newProps.project) {
            this.cacheIdProject = `region/${newProps.project.region}/project/${newProps.project.id}`;
            this.loadRegistries();
        }

        // update the name of the selected registry
        if (newProps.selectedRegistryName) {
            // determine the selected registry
            const selectedRegistry = this.determineSelectedRegistry(newProps.selectedRegistryName, this.state.selectedRegistry, this.state.registries);
            this.logger.debug(`${fn}- selectedRegistry: '${JSON.stringify(selectedRegistry)}', state.selectedRegistryName: '${this.state.selectedRegistryName}'`);

            // only update if necessary
            if (newProps.selectedRegistryName !== (this.state.selectedRegistry && this.state.selectedRegistry.name)) {
                this.setState(() => ({
                    selectedRegistry,
                    selectedRegistryName: newProps.selectedRegistryName
                }));
            }
        }
    }

    public handleRegistriesChange(event) {
        this.logger.debug('handleRegistriesChange');
        const newLocation = event.selectedItem;

        if (newLocation) {
            this.setState(() => {
                if (this.props.onSelect) {
                    this.props.onSelect(newLocation);
                }
                return {
                    isLoading: false,
                    selectedRegistry: newLocation,
                };
            });
        }
    }

    public loadRegistries() {
        if (this.removeCacheListener) {
            this.removeCacheListener();
        }

        // reset the error state
        this.setState(() => ({ disabled: false, error: undefined, isLoading: true, failedToListRegistries: undefined, emptyStateNotification: undefined }));

        this.removeCacheListener = cache.listen(this.REGISTRIES_CACHE_NAME, this.onRegistriesLoaded, this.onRegistriesLoadingFailed);
        cache.update(this.cacheIdProject, this.REGISTRIES_CACHE_NAME);
    }

    public onRegistriesLoaded(registries: configModel.IUIRegistrySecret[]) {
        const fn = 'onRegistriesLoaded ';
        this.logger.debug(`${fn}> ${registries && registries.length} registries`);

        let allRegistryOptions = [];

        if (this.props.allowToUsePublicRegistry) {
            allRegistryOptions.push(clgContainerRegistryName.getDummyUsePublicRegisty());
        }

        if (registries && registries.length > 0) {

            allRegistryOptions = allRegistryOptions.concat(registries);

            // determine the registry that should be selected
            const selectedRegistry = this.determineSelectedRegistry(this.state.selectedRegistryName, this.state.selectedRegistry, allRegistryOptions);
            this.logger.debug(`${fn}- selectedRegistryName: '${this.state.selectedRegistryName}' selectedRegistry: '${selectedRegistry && selectedRegistry.name}'`);

            this.setState(() => ({ registries: allRegistryOptions, selectedRegistry, error: undefined, isLoading: false, failedToListRegistries: undefined }));

            // once we loaded the registries, we can de-register from the cache listener
            this.removeCacheListener();

            if (selectedRegistry && selectedRegistry.id && this.props.onSelect) {
                this.props.onSelect(selectedRegistry);
            }
        } else {
            const emptyStateNotification: IClgInlineNotification = {
                actionFn: this.props.addRegistryFn,
                actionTitle: t('clg.component.registrySelector.noregistries.action'),
                kind: 'info',
                title: t('clg.component.registrySelector.noregistries.title'),
            };
            this.setState({ isLoading: false, registries: allRegistryOptions, emptyStateNotification });
        }
        this.logger.debug(`${fn}<`);
    }

    public onRegistriesLoadingFailed(requestError: commonModel.UIRequestError) {
        const fn = 'onRegistriesLoadingFailed ';
        this.logger.debug(`${fn}>`);

        const errorNotification: IClgInlineNotification = {
            actionFn: this.loadRegistries,
            actionTitle: t('clg.component.registrySelector.error.action'),
            kind: 'error',
            title: t('clg.component.registrySelector.error.title'),
        };

        this.setState(() => {
            if (this.props.onError) {
                this.props.onError(errorNotification);
            }

            return {
                disabled: true,
                error: errorNotification,
                failedToListRegistries: t('clg.component.registrySelector.error.title'),
                isLoading: false,
                registries: [],
            };
        });
        this.logger.debug(`${fn}<`);
    }

    public render() {
        this.logger.debug(`render - selectedRegistryName: '${this.props.selectedRegistryName}', selectedRegistry: ${this.state.selectedRegistry && this.state.selectedRegistry.name}, registries: ${JSON.stringify(this.state.registries)}`);

        // loading animation
        if (this.state.isLoading) {
            return (
                <FormItem className='clg-registry-selector loading'>
                    <FormLabel>{t('clg.common.label.registry')}</FormLabel>
                    <DropdownSkeleton />
                </FormItem>
            );
        }

        // empty state
        if (this.state.emptyStateNotification) {
            return (
                <FormItem className='clg-registry-selector empty-state'>
                    <FormLabel>{t('clg.common.label.registry')}</FormLabel>
                    <InlineNotification
                        kind={this.state.emptyStateNotification.kind}
                        statusIconDescription={this.state.emptyStateNotification.title}
                        lowContrast={true}
                        title={this.state.emptyStateNotification.title}
                        subtitle={(<span>{t(this.state.emptyStateNotification.subtitle)}</span>)}
                        onCloseButtonClick={this.loadRegistries}
                        actions={this.state.emptyStateNotification.actionFn &&
                            (
                                <NotificationActionButton
                                    onClick={this.state.emptyStateNotification.actionFn}
                                >
                                    {this.state.emptyStateNotification.actionTitle}
                                </NotificationActionButton>
                            )
                        }
                    />
                </FormItem>
            );
        }

        // render the dropdown
        return (
            <FormItem className='clg-registry-selector loaded'>
                <Dropdown
                    disabled={this.props.disabled}
                    id={'registries_selector'}
                    type={'default'}
                    titleText={t('clg.common.label.registry')}
                    label={t('clg.common.label.registry')}
                    light={!!this.props.light}
                    items={this.state.registries}
                    itemToString={this.itemToString}
                    selectedItem={this.state.selectedRegistry}
                    onChange={this.handleRegistriesChange}
                    invalid={!!this.state.failedToListRegistries}
                    invalidText={this.state.failedToListRegistries}
                />
                {!!this.props.showAddBtn && (
                    <Button
                        className='add-registry-btn'
                        id={'add-registry-btn'}
                        kind='tertiary'
                        disabled={this.props.disabled}
                        renderIcon={Add16}
                        size={'field'}
                        onClick={this.props.addRegistryFn}
                    >
                        {t('clg.component.registrySelector.action.addregistry')}
                    </Button>
                )}
            </FormItem>
        );
    }

    private closeEmptyStateNotification() {
        this.setState({ emptyStateNotification: undefined });
    }

    private itemToString(registry: configModel.IUIRegistrySecret) {
        return clgContainerRegistryName.value(registry);
    }

    private determineSelectedRegistry(selectedRegistryName: string, selectedRegistry: configModel.IUIRegistrySecret, allRegistries: configModel.IUIRegistrySecret[]) {
        const fn = 'determineSelectedRegistry ';
        this.logger.debug(`${fn}> allRegistries: ${JSON.stringify(allRegistries)}`);
        if (!allRegistries) {
            this.logger.debug(`${fn}< no registries loaded`);
            return selectedRegistry; // might undefined
        }
        // check whether there is need to update the selectedItem
        if (selectedRegistry && selectedRegistry.name === selectedRegistryName) {
            this.logger.debug(`${fn}< ${selectedRegistry && selectedRegistry.name} - selected registry equals the given registry name`);
            return selectedRegistry;
        }

        // iterate over all registries and assign the selected (if found)
        for (const registry of allRegistries) {
            if (registry.name === selectedRegistryName) {
                this.logger.debug(`${fn}< ${registry && registry.name} - found registry in list`);
                return registry;
            }
        }

        // if none could be selected, use the first one from the list
        if (allRegistries.length > 0) {
            this.logger.debug(`${fn}< ${allRegistries[0].name} - choose the first one from the list`);
            return allRegistries[0];
        }

        this.logger.debug(`${fn}< undefined`);
        return undefined;
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgRegistrySelector.propTypes = {
    addRegistryFn: PropTypes.func.isRequired,
    allowToUsePublicRegistry: PropTypes.bool,
    disabled: PropTypes.bool,
    onGetReloadFn: PropTypes.func,
    light: PropTypes.bool,
    onError: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    project: PropTypes.object,
    selectedRegistryName: PropTypes.string,
    showAddBtn: PropTypes.bool,
};

export default ClgRegistrySelector;
