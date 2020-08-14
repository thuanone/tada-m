// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// pal + carbon
import SectionHeading from '@console/pal/Components/SectionHeading';
import { RadioTile, TileGroup } from '../../common/carbon';

// coligo
import t from '../../../utils/i18n';
import { IConfigTypes } from '../../common/types';

interface IProps {
    selectedType: IConfigTypes;
    onChange: (selectedType) => void;
}

interface IState {
    selectedType: IConfigTypes;
}

class ClgConfigTypeSelector extends React.Component<IProps, IState> {
    private readonly COMPONENT = 'ClgConfigTypeSelector';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    constructor(props) {
        super(props);
        this.changeHandler = this.changeHandler.bind(this);

        this.state = {
            selectedType: props.selectedType || IConfigTypes.CONFMAP,
        };
    }

    public componentDidMount() {
        this.logger.debug('ClgConfigTypeSelector mounted');
    }

    public changeHandler(newType) {
        this.setState(() => {
            if (this.props.onChange) {
                this.props.onChange(newType);
            }
            return {
                selectedType: newType,
            };
        });
    }

    public render() {
        return (
            <div className='bx--row clg-tile-selector clg-config-type-selector'>
                <div className='bx--col-xs-4 bx--col-sm-5 bx--col-md-6 bx--col-lg-6 bx--col-xl-6 bx--col-xxl-6'>
                    <SectionHeading
                        headingElement={'h4'}
                        title={t('clg.component.configTypeSelector.title')}
                    />
                    <br/>
                    <TileGroup
                        defaultSelected={this.state.selectedType}
                        legend=''
                        name='tile-group'
                        onChange={this.changeHandler}
                        valueSelected={this.state.selectedType}
                        className={'clg-type-selector-group'}
                    >
                        <RadioTile
                            id='tile-2'
                            light={false}
                            name='tiles'
                            tabIndex={0}
                            value={IConfigTypes.CONFMAP}
                            className={'pal--card clg-type-selector-tile'}
                        >
                            <div className='pal--card__header'>
                                <div><h3 className='pal--card__title'>{t('clg.component.configTypeSelector.type.confmap.name')}</h3></div>
                            </div>
                            <div className='pal--card__body'>
                                <div>
                                {t('clg.component.configTypeSelector.type.confmap.desc')}
                                </div>
                            </div>
                        </RadioTile>
                        <RadioTile
                            light={false}
                            name='tiles'
                            tabIndex={0}
                            value={IConfigTypes.SECRET}
                            className={'pal--card clg-type-selector-tile'}
                        >
                            <div className='pal--card__header'>
                                <div><h3 className='pal--card__title'>{t('clg.component.configTypeSelector.type.secret.name')}</h3></div>
                            </div>
                            <div className='pal--card__body'>
                                <div>
                                    {t('clg.component.configTypeSelector.type.secret.desc')}
                                </div>
                            </div>
                        </RadioTile>
                    </TileGroup>
                </div>
            </div>
        );
    }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ClgConfigTypeSelector.propTypes = {
    onChange: PropTypes.func.isRequired,
    selectedType: PropTypes.string,
};

export default ClgConfigTypeSelector;
