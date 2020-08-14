import React from 'react';
import { ButtonSkeleton, IconSkeleton, SkeletonText } from './carbon';

class PageHeaderSkeleton extends React.Component {
  // istanbul bug when calling super https://github.com/gotwarlost/istanbul/issues/690
  // istanbul ignore next
  constructor(props) {
    super(props);
    this.state = {};
  }

  public render() {
    return (
      <div className='armada-header-wrapper'>
        <div className='armada-breadcrumbs armada-breadcrumbs-back'>
          <SkeletonText width='5rem' />
        </div>
        <div className='armada-page-header'>
          <h2 className='armada-page-header-title'>
            <div className='armada-page-header-icon'>
              <IconSkeleton />
            </div>
            <SkeletonText heading={true} width='10rem' />
          </h2>
          <div className='armada-page-header-info'>
            <div className='armada-page-header-status' />
            <div className='armada-page-header-actions'>
              <ButtonSkeleton />
            </div>
          </div>
        </div>
        <div className='armada-page-header-description'>
          <SkeletonText width='25%' />
        </div>
      </div>
    );
  }
}

export default PageHeaderSkeleton;
