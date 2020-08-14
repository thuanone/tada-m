import PropTypes from 'prop-types';
import React from 'react';

interface IProps {
  id: string;
  errors: boolean;
  infos: boolean;
  confirmations: boolean;
  messages: boolean;
}

interface IState {
  navItems: any[];
  open: boolean;
  page: any;
}

class Page extends React.Component<IProps, IState> {
  public render() {
    const attrs = { className: 'coligo-page ibm-cloud-app', id: undefined };
    if (this.props.id) {
      attrs.id = this.props.id;
    }
    // FIXME: We need to continue to use the old ErrorModal and InfoModal until we move fully to the
    // shared one in armada-ui-common. So we need to include both for now.
    return (
      <div className='bx--grid' {...attrs}>
        {/*{this.props.errors && <ErrorModal />}
        this.props.infos && <InfoModal />}
        {this.props.confirmations && <ClgConfirmationModal />*/}
        {this.props.children}
      </div>
    );
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
Page.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
  confirmations: PropTypes.bool,
  errors: PropTypes.bool,
  id: PropTypes.string,
  infos: PropTypes.bool,
  messages: PropTypes.bool
};

export default Page;
