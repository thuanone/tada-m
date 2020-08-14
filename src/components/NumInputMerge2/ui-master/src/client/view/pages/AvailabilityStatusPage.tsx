// react
import PropTypes from 'prop-types';
import React from 'react';
import { withRouter } from 'react-router-dom';

// carbon + pal
import { Button } from '@console/pal/carbon-components-react';
import { Message, PageHeader} from '@console/pal/Components';

// coligo
import t from '../../utils/i18n';

const proxyRoot = window.armada.config.proxyRoot;

interface IProps {
  history: any[];
  location: {
    search: string
  };
  match: any;
}

class AvailabilityStatusPage extends React.Component<IProps, {}> {
  private readonly COMPONENT = 'AvailabilityStatusPage.';

  constructor(props) {
    super(props);
    this.redirectToColigoOverviewPage = this.redirectToColigoOverviewPage.bind(this);
  }

  public redirectToColigoOverviewPage() {
    window.location.href = `${proxyRoot}overview`;
  }

  public render() {
    const pageClassNames = 'page detail-page health-page';

    return (
      <div className={pageClassNames}>
        <PageHeader title={t('clg.page.availability-status.title')}>
          <Button size='field' onClick={this.redirectToColigoOverviewPage}>
            {t('clg.page.availability-status.button.gotocoligo')}
          </Button>
        </PageHeader>
        <div className={'page-content'}>
          <div className={'bx--grid'}>
            <Message
                caption={''}
                icon='HIERARCHY'
                isLarge={true}
                isTileWrapped={true}
                text={t('clg.page.availability-status.message.text')}
                id='availability-status'
            />
          </div>
        </div>
      </div>
    );
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
AvailabilityStatusPage.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func,
  }),
  location: PropTypes.shape({
    search: PropTypes.string,
  }),
  match: PropTypes.shape({
    params: PropTypes.shape({
      subpage: PropTypes.string,
    }),
  }),
};

export default withRouter(AvailabilityStatusPage);
