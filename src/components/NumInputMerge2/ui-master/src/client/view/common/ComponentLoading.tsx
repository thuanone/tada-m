import PropTypes from 'prop-types';
import React from 'react';
import { Link, withRouter } from 'react-router-dom';

import { Message, PageHeader } from '@console/pal/Components';
import t from '../../utils/i18n';
import img from '../../utils/img';
import nav from '../../utils/nav';

// The loading component to be used with react-loadable
const ComponentLoading = (props) => {
  if (props.error) {
    console.error(props.error);
    const breadcrumbs = [{
      to: nav.toGettingStartedOverview(),
      value: t('clg.breadcrumb.home'),
    }];
    const xhr = {
      responseJSON: {
        incidentID: 'bundle-import-failed',
      },
      status: 500,
    };
    return (
      <div className=''>
        <PageHeader
          breadcrumbs={breadcrumbs}
          linkComponent={Link}
          title={t('clg.page.error.title')}
        />
        <div className='page-content'>
          <Message
            id={props.error && props.error.title || 'unknown'}
            caption={(props.error && props.error.clgId) || ''}
            text={`${t('clg.page.error.title')} ${t('clg.page.error.subtitle')}`}
            icon='ERROR'
            isTileWrapped={true}
          />
        </div>
      </div>
    );
  }
  // } else if (props.pastDelay) return <div className="armada-async-load">{t('Loading...')}</div>;
  return null;
};
ComponentLoading.propTypes = {
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  // pastDelay: PropTypes.bool,
};
ComponentLoading.defaultProps = {
  error: false,
};

export { ComponentLoading };
export default withRouter(ComponentLoading);
