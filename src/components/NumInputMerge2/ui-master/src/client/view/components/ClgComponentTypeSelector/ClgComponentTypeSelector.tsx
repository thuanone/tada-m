// react
import PropTypes from 'prop-types';
import React from 'react';

// pal + carbon
import SectionHeading from '@console/pal/Components/SectionHeading';
import { RadioTile, TileGroup } from '../../common/carbon';

// coligo
import t from '../../../utils/i18n';
import { IComponentTypes } from '../../common/types';

interface IProps {
    selectedType: IComponentTypes;
    onChange: (selectedType) => void;
}

interface IState {
    selectedType: IComponentTypes;
}

class ComponentTypeSelector extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.changeHandler = this.changeHandler.bind(this);

        this.state = {
            selectedType: props.selectedType || IComponentTypes.APP,
        };
    }

    public componentDidMount() {
        // console.log('ComponentTypeSelector mounted');
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
            <div className='bx--row clg-tile-selector'>
                <div className='bx--col-xs-4 bx--col-sm-5 bx--col-md-6 bx--col-lg-6 bx--col-xl-6 bx--col-xxl-6'>
                    <SectionHeading
                        headingElement={'h4'}
                        title={t('clg.component.componentTypeSelector.title')}
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
                            light={false}
                            name='tiles'
                            tabIndex={0}
                            value={IComponentTypes.APP}
                            className={'pal--card clg-type-selector-tile'}
                        >
                            <div className='pal--card__header'>
                                <div><h3 className='pal--card__title'>{t('clg.components.type.application')}</h3></div>
                            </div>
                            <div className='pal--card__body'>
                                <div>
                                    {t('clg.component.componentTypeSelector.type.app.desc')}
                                </div>
                            </div>
                        </RadioTile>
                        <RadioTile
                            id='tile-2'
                            light={false}
                            name='tiles'
                            tabIndex={0}
                            value={IComponentTypes.JOBDEF}
                            className={'pal--card clg-type-selector-tile'}
                        >
                            <div className='pal--card__header'>
                                <div><h3 className='pal--card__title'>{t('clg.components.type.jobdefinition')}</h3></div>
                            </div>
                            <div className='pal--card__body'>
                                <div>
                                    {t('clg.component.componentTypeSelector.type.job.desc')}
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
ComponentTypeSelector.propTypes = {
    onChange: PropTypes.func.isRequired,
    selectedType: PropTypes.string,
};

export default ComponentTypeSelector;
