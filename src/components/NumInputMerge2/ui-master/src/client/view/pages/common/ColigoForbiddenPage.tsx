import React from 'react';

import { Tag } from 'carbon-components-react';

import app from '../../../utils/app';
import { t, tHtml } from '../../../utils/i18n';
import img from '../../../utils/img';

class ColigoForbiddenPage extends React.Component {

  constructor(props) {
    super(props);
  }

  public componentDidMount() {
    app.arrivedOnPage('clg.pages.forbidden');
  }

  public render() {
    return (
      <div className='page overview-page clg-forbidden-page'>
        <div className='page-content'>
          <div className='bx--grid bx--grid--bleed hero-teaser'>
            <div className='bx--row'>
              <div className='bx--col-lg-8 bx--col-md-8 hero-teaser__text'>
                <h2 className='productive-heading-04 hero-teaser__text-title'>
                  {t('clg.page.overview.title')}
                </h2>
                <div className='hero-teaser__tag'><Tag type='gray'>{t('clg.page.overview.tag.experimental')}</Tag></div>
                <div className='productive-heading-03 hero-teaser__text-subtitle'>{tHtml('clg.page.coligo-forbidden.desc')}</div>
                <p className='bx--type-caption'>{tHtml('clg.page.coligo-forbidden.goback')}</p>
              </div>
              <div className='bx--offset-lg-1 bx--col-lg-7 bx--col-md-0 hero-teaser__image'>
                <img src={img.get('Coligo-UnderConstruction')} alt={t('clg.page.overview.title')}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ColigoForbiddenPage;
