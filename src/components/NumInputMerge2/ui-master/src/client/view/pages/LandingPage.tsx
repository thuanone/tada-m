import PageHeaderSkeleton from '@console/pal/Components/PageHeader/skeleton';
import PropTypes from 'prop-types';
import React from 'react';
import { withRouter } from 'react-router-dom';
import GlobalStateContext from '../common/GlobalStateContext';

// @ts-ignore
const config = window.armada.config;

interface IProps {
  history: string[];
}

class LandingPage extends React.Component<IProps, {}> {
  constructor(props) {
    super(props);
  }

  public componentDidMount() {
    this.props.history.push(`${config.proxyRoot}overview`);
    if (this.context.onUpdateState) {
      this.context.onUpdateState('currentPage.title', 'Landing Page');
    }
  }

  public render() {
    return (
      <div className='page coligo-landing-page'>
        <PageHeaderSkeleton title={true} breadcrumbs={true}/>
      </div>
    );
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
LandingPage.propTypes = {
  history: PropTypes.object.isRequired,
};

const withRouterLandingPage = withRouter(LandingPage);
withRouterLandingPage.WrappedComponent.contextType = GlobalStateContext;

export { LandingPage };
export default withRouterLandingPage;
