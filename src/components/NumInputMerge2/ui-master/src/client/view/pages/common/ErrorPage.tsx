import React from 'react';
import app from '../../../utils/app';
import t from '../../../utils/i18n';
import img from '../../../utils/img';
import GlobalStateContext from '../../common/GlobalStateContext';

class ErrorPage extends React.Component {

  constructor(props) {
    super(props);
  }

  public componentDidMount() {
    if (this.context.onUpdateState) {
      this.context.onUpdateState({ currentPage: { title: 'Error Page' } });
    }

    app.arrivedOnPage('clg.pages.error');
    $('.hero-image').css('backgroundImage', `url("${img.get('Coligo-UnderConstruction')}")`);
  }

  public render() {
    return (
      <div className='page error-page'>
        <div className='error-page-section error-page-hero'>
          <div className='error-page-container hero-image'>
            <div className='error-page-hero-text'>
              <p className='bx--type-alpha'>{t('clg.page.error.title')}</p>
              <p className='subtitle'>{t('clg.page.error.subtitle')}</p>
              <p className='bx--type-beta'>{t('clg.page.error.desc')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ErrorPage.contextType = GlobalStateContext;

export default ErrorPage;
