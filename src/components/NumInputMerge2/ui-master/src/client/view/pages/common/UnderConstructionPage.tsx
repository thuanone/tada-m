import React from 'react';
import app from '../../../utils/app';
import t from '../../../utils/i18n';
import img from '../../../utils/img';
import GlobalStateContext from '../../common/GlobalStateContext';

class UnderConstructionPage extends React.Component {

  constructor(props) {
    super(props);
  }

  public componentDidMount() {
    if (this.context.onUpdateState) {
      this.context.onUpdateState({ currentPage: { title: 'Under Construction' } });
    }
    app.arrivedOnPage('clg.pages.underconstruction');
    $('.hero-image').css('backgroundImage', `url("${img.get('Coligo-UnderConstruction')}")`);
  }

  public render() {
    return (
      <div className='page under-construction'>
        <div className='under-construction-section under-construction-hero'>
          <div className='under-construction-container hero-image'>
            <div className='under-construction-hero-text'>
              <p className='bx--type-alpha'>{t('clg.page.under-construction.title')}</p>
              <p className='subtitle'>{t('clg.page.under-construction.subtitle')}</p>
              <p className='bx--type-beta'>{t('clg.page.under-construction.desc')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

UnderConstructionPage.contextType = GlobalStateContext;

export default UnderConstructionPage;
