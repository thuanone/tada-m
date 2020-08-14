import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

import { Dropdown, DropdownSkeleton, FormItem, FormLabel } from '@console/pal/carbon-components-react';

import * as commonModel from '../../../../common/model/common-model';
import * as projModel from '../../../../common/model/project-model';
import cache from '../../../utils/cache';
import t from '../../../utils/i18n';
import { IClgInlineNotification } from '../../model/common-view-model';

interface IProps {
    disabled?: boolean;
    onError: (error) => any;
    onSelect: (region: projModel.IUIRegion) => any;
}

interface IState {
    regions?: any[];
    disabled: boolean;
    error?: IClgInlineNotification;
    failedToListRegions?: string;
    selectedRegion?: projModel.IUIRegion;
    isLoading: boolean;
}

class ClgRegionSelector extends React.Component<IProps, IState> {
    private readonly COMPONENT = 'ClgRegionSelector';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    private readonly REGION_CACHE_NAME = 'coligo-regions';

    private removeCacheListener: () => any;

    constructor(props) {
        super(props);

        this.handleRegionChange = this.handleRegionChange.bind(this);
        this.itemToString = this.itemToString.bind(this);
        this.loadRegions = this.loadRegions.bind(this);
        this.onRegionsLoaded = this.onRegionsLoaded.bind(this);
        this.onRegionsLoadingFailed = this.onRegionsLoadingFailed.bind(this);

        const regions = [{ id: 'us-south' }];

        this.state = {
            disabled: this.props.disabled || false,
            isLoading: false,
            regions,
            selectedRegion: undefined,
        };
    }

    public componentDidMount() {
        this.logger.debug('componentDidMount');
        this.loadRegions();
    }

    public componentWillUnmount() {
        // remove the cache listener in order to avoid background syncs with the backend
        if (this.removeCacheListener) {
            this.removeCacheListener();
        }
    }

    public UNSAFE_componentWillReceiveProps(newProps) {
        const fn = 'componentWillReceiveProps ';
        this.logger.debug(`${fn}- this.state.disabled: '${this.state.disabled}', props.disabled: '${newProps && newProps.disabled}'`);

        // check whether the disabled value has changed
        if (this.state.disabled !== newProps.disabled) {
            this.setState({ disabled: newProps.disabled });
        }
    }

    public handleRegionChange(event) {
        this.logger.debug('handleRegionChange');
        const newLocation = event.selectedItem;

        if (newLocation) {
            this.setState(() => {
                if (this.props.onSelect) {
                    this.props.onSelect(newLocation);
                }
                return {
                    isLoading: false,
                    selectedRegion: newLocation,
                };
            });
        }
    }

    public onRegionsLoaded(regions) {
        const fn = 'onRegionsLoaded ';
        this.logger.debug(`${fn}>`);

        let selectedRegion;
        if (regions && regions.length > 0) {

            if (!selectedRegion) {
                selectedRegion = regions[0];
            }

            if (selectedRegion && selectedRegion.id && this.props.onSelect) {
                this.props.onSelect(selectedRegion);
            }

            this.setState(() => ({ regions, selectedRegion, error: null, isLoading: false, failedToListRegions: null }));

            // once we loaded the regions, we can de-register from the cache listener
            this.removeCacheListener();
        }
        this.logger.debug(`${fn}<`);
    }

    public onRegionsLoadingFailed(requestError: commonModel.UIRequestError) {
        const fn = 'onRegionsLoadingFailed ';
        this.logger.debug(`${fn}> failed to load regions - ${commonModel.stringifyUIRequestError(requestError)}`);

        const errorNotification: IClgInlineNotification = {
            actionFn: this.loadRegions,
            actionTitle: t('clg.component.regionSelector.error.action'),
            kind: 'error',
            title: t('clg.component.regionSelector.error.title'),
        };

        this.setState(() => {
            if (this.props.onError) {
                this.props.onError(errorNotification);
            }

            return {
                disabled: true,
                error: errorNotification,
                failedToListRegions: t('clg.component.regionSelector.error.title'),
                isLoading: false,
                regions: [],
            };
        });
        this.logger.debug(`${fn}<`);
    }

    public render() {
        this.logger.debug('render');
        return (
            <FormItem className='clg-region-selector'>
                {this.state.isLoading ? (
                    <React.Fragment>
                        <FormLabel>{t('clg.common.label.region')}</FormLabel>
                        <DropdownSkeleton />
                    </React.Fragment>
                ) : (
                        <Dropdown
                            disabled={this.state.disabled}
                            id={'region_selector'}
                            type={'default'}
                            titleText={t('clg.common.label.region')}
                            label={t('clg.common.label.region')}
                            items={this.state.regions}
                            itemToString={this.itemToString}
                            selectedItem={this.state.selectedRegion}
                            onChange={this.handleRegionChange}
                            invalid={(this.state.failedToListRegions !== null)}
                            invalidText={this.state.failedToListRegions}
                        />
                    )
                }
            </FormItem>
        );
    }

    private loadRegions() {
        if (this.removeCacheListener) {
            this.removeCacheListener();
        }

        // reset the error state
        this.setState(() => ({ disabled: false, error: null, isLoading: true, failedToListRegions: null }));

        this.removeCacheListener = cache.listen(this.REGION_CACHE_NAME, this.onRegionsLoaded, this.onRegionsLoadingFailed);
        cache.update(null, this.REGION_CACHE_NAME);
    }

    private itemToString(item) {
        return (item ? `${t('clg.common.region.' + item.id)}` : 'N/A');
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgRegionSelector.propTypes = {
    onError: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
};

export default ClgRegionSelector;
