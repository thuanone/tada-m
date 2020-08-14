
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import {
    OrderSummaryV2,
} from '@console/pal/Components';
import { getLocale } from '@console/pal/Utilities';

import t from '../../../utils/i18n';
import GlobalStateContext from '../../common/GlobalStateContext';
import {IComponentTypes} from '../../common/types';

interface IProps {
    onCancelHandler: () => void;
    onCreateHandler: () => void;
    isCreateDisabled: boolean;
    isCreating: boolean;
    componentType: IComponentTypes;
}

class CustomOrderSummary extends React.Component<IProps, {}> {
    private readonly COMPONENT = 'CustomOrderSummary';

    // setup the logger
    private logger = log.getLogger(this.COMPONENT);

    constructor(props) {
        super(props);

    }

    public componentDidMount() {
        this.logger.debug('componentDidMount');
    }

    public render() {
        const language = getLocale(window.navigator.language);
        this.logger.debug(`render - lang: '${language}'`);

        let isLoading = false;
        let isCreateDisabled = false;

        if (typeof this.props.isCreating !== 'undefined') {
            isLoading = this.props.isCreating;
        }

        if (typeof this.props.isCreateDisabled !== 'undefined') {
            isCreateDisabled = this.props.isCreateDisabled;
        }

        return (
            <OrderSummaryV2
                className='coligo-create--order-summary'
                estimateData={{}}
                estimateButtonProps={{
                    className: 'hide-estimate-btn',
                }}
                isFree={true}
                items={[
                {
                    details: [
                        { name: t('clg.page.create.app.summary.category.app.plan.text') },
                    ],
                    name: t('clg.page.create.app.summary.category.app'),
                    value: t('clg.page.create.app.summary.category.app.plan.price')
                }
                ]}
                locale={language}
                primaryButtonText={t('clg.common.label.deploy')}
                primaryButtonLoading={isLoading}
                primaryButtonLoadingText={t('clg.page.create.app.summary.loadingText')}
                primaryButtonProps={{
                    disabled: isCreateDisabled,
                    onClick: this.props.onCreateHandler,
                }}
                secondaryButtonText={t('clg.common.label.cancel')}
                secondaryButtonProps={{
                    disabled: isLoading,
                    onClick: this.props.onCancelHandler,
                }}
                termsText={<a className='bx--link' href='https://www.ibm.com/software/sla/sladb.nsf/sla/bm-6605-19' target='_blank' rel='noopener noreferrer'>{t('clg.page.create.project.summary.sum.termsandconditions')}</a>}
                totalCost={t('clg.page.create.app.summary.sum.price')}
                totalCostText={`${t('clg.page.create.app.summary.sum.text')}`}
            />
        );
    }
}

CustomOrderSummary.contextType = GlobalStateContext;

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
CustomOrderSummary.propTypes = {
    componentType: PropTypes.string,
    isCreateDisabled: PropTypes.bool,
    isLoading: PropTypes.bool,
    onCancelHandler: PropTypes.func.isRequired,
    onCreateHandler: PropTypes.func.isRequired,
};

export default CustomOrderSummary;
