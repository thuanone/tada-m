// tslint:disable:jsx-no-lambda
import PropTypes from 'prop-types';
import React from 'react';

// carbon + pal
import { CodeSnippet, Link } from '@console/pal/carbon-components-react';
import { PageHeader } from '@console/pal/Components';

// coligo
import app from '../../utils/app';
import { copyStringToClipboard } from '../../utils/clipboard';
import { t, tHtml } from '../../utils/i18n';
import nav from '../../utils/nav';

interface IProps {
  history: any[];
}

class CliPage extends React.Component<IProps, {}> {

  private readonly codeSnippets: { [key: string]: string } = {
    'first-step': '$ ibmcloud plugin install code-engine',
    'second-step': '$ ibmcloud plugin list',
    'second-step-output': 'Plugin Name\t Version\tStatus\ncode-engine/ce\t 0.3.1363',
    'third-step': '$ ibmcloud ce help',
  };

  constructor(props) {
    super(props);

    this.navigateToDocsCliSetupPage = this.navigateToDocsCliSetupPage.bind(this);
  }

  public componentDidMount() {
    app.arrivedOnPage('clg.pages.cli');

  }

  public copyToClipBoard(id: string): void {
    let snippetValue = this.codeSnippets[id];
    if (snippetValue) {
      snippetValue = snippetValue.replace('$ ', '');
      copyStringToClipboard(snippetValue);
    }

  }

  public someVoid(): void {
    // OK
  }

  public navigateToDocsCliSetupPage() {
    this.props.history.push();
  }

  public render() {
    return (
      <div className='cli-page page'>
        <PageHeader
          title={t('clg.page.cli.title')}
        >
          <Link
            className='cli-page--action-link bx--btn bx--btn--field bx--btn--primary'
            target='_blank'
            rel='noopener noreferrer'
            href={nav.getDocsLink('cli-setup')}
          >
            {t('clg.page.cli.action.download')}
          </Link>
        </PageHeader>
        <div className='page-content bx--grid'>
          <div className='bx--row'>
            <div className='bx--col-lg-8'>
              <div>
                <p className='productive-heading-02'>{t('clg.page.cli.setup.prereq.title')}</p>
                <div className='cli-page--text'>{tHtml('clg.page.cli.setup.prereq.text', { docsLink: nav.getDocsLink('cloud-cli-setup') })}</div>
              </div>

              <div className='cli-page--setup-step'>
                <p className='productive-heading-02'>{t('clg.page.cli.setup.step.first.title')}</p>
                <CodeSnippet
                  ariaLabel={t('clg.common.label.copy.label')}
                  className='cli-page--snippet'
                  copyButtonDescription={t('clg.common.label.copy.label')}
                  copyLabel={t('clg.common.label.copy.label')}
                  feedback={t('clg.common.label.copy.feedback')}
                  onClick={() => { this.copyToClipBoard('first-step'); }}
                >
                  {this.codeSnippets['first-step']}
                </CodeSnippet>
              </div>

              <div className='cli-page--setup-step'>
                <p className='productive-heading-02'>{t('clg.page.cli.setup.step.second.title')}</p>
                <CodeSnippet
                  ariaLabel={t('clg.common.label.copy.label')}
                  className='cli-page--snippet'
                  copyButtonDescription={t('clg.common.label.copy.label')}
                  copyLabel={t('clg.common.label.copy.label')}
                  feedback={t('clg.common.label.copy.feedback')}
                  onClick={() => { this.copyToClipBoard('second-step'); }}
                >
                  {this.codeSnippets['second-step']}
                </CodeSnippet>
                <div className='cli-page--text'>{t('clg.page.cli.setup.step.second.text')}</div>
                <CodeSnippet
                  ariaLabel={t('clg.common.label.copy.label')}
                  className='cli-page--output'
                  copyButtonDescription={t('clg.common.label.copy.label')}
                  copyLabel={t('clg.common.label.copy.label')}
                  feedback={t('clg.common.label.copy.feedback')}
                  onClick={this.someVoid}
                  type='multi'
                >
                  {this.codeSnippets['second-step-output']}
                </CodeSnippet>
              </div>

              <div className='cli-page--setup-step'>
                <p className='productive-heading-02'>{t('clg.page.cli.setup.step.third.title')}</p>
                <CodeSnippet
                  ariaLabel={t('clg.common.label.copy.label')}
                  className='cli-page--snippet'
                  copyButtonDescription={t('clg.common.label.copy.label')}
                  copyLabel={t('clg.common.label.copy.label')}
                  feedback={t('clg.common.label.copy.feedback')}
                  onClick={() => { this.copyToClipBoard('third-step'); }}
                >
                  {this.codeSnippets['third-step']}
                </CodeSnippet>
              </div>

              <div className='cli-page--setup-step'>
                <span>{tHtml('clg.page.cli.setup.moreinfos', {docsLink : nav.getDocsLink('cli-reference')})}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// @ts-ignore
CliPage.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func,
  }),
};

export default CliPage;
