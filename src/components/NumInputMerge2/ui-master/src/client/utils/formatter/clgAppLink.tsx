import { Launch16 } from '@carbon/icons-react';
import React from 'react';
import t from '../i18n';

const getAppUrl = (item): string => {
    let appUrl = item.publicServiceUrl || '';
    appUrl = appUrl.replace('http://', 'https://');
    return appUrl;
};

const render = (item) => {
    const appURL = getAppUrl(item);
    return (
        <div>
            <a
                className='bx--type-caption'
                href={appURL}
                key={`${item.id}-link-label`}
                rel='noopener noreferrer'
                target='_blank'
                title={t('clg.application.link.tooltip', {appURL, interpolation: { escapeValue: false }})}
            >
                {t('clg.application.link')}
                <Launch16 className='clg-filled-link clg-link-icon' key={`${item.id}-link-icon`} />
            </a>
        </div>
    );
};

const value = (item) => {
    return getAppUrl(item);
};

export default { render, value };
