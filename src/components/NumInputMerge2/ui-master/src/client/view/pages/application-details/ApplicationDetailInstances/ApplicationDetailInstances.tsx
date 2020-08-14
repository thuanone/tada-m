// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { LineChart } from '@carbon/charts-react';

// coligo
import * as appModel from '../../../../../common/model/application-model';
import t from '../../../../utils/i18n';

interface IProps {
  show: boolean;
  appName: string;
  runningInstances?: appModel.IUIApplicationInstance[];
}

interface IState {
  chartData: any;
  chartOptions: any;
}

class ApplicationDetailInstances extends React.Component<IProps, IState> {
  private readonly COMPONENT = 'ApplicationDetailInstances';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  private readonly MAX_NUMBER_OF_DATA_POINTS = 500;

  constructor(props) {
    super(props);

    const applicationName: string = props.appName;

    this.state = {
      chartData: {
        datasets: [{
          data: [],
          label: applicationName,
        }],
        labels: [applicationName],
      },
      chartOptions: {
        axes: {
          bottom: {
            scaleType: 'time',
            secondary: true,
          },
          left: {
            primary: true,
            ticks: {
              min: 0,
            }
          }
        },
        height: '400px',
        title: t('clg.page.application.instances.title'),
      },
    };
  }

  public componentDidMount() {
    this.logger.debug('componentDidMount');
  }

  public UNSAFE_componentWillReceiveProps(newProps) {
    this.logger.debug('componentWillReceiveProps');

    if (newProps.runningInstances) {

      const numberOfInstances = newProps.runningInstances ? newProps.runningInstances.length : 0;

      const newDataPoint = {
        date: new Date().toISOString(),
        value: numberOfInstances,
      };
      const chartData = this.state.chartData;
      chartData.datasets[0].data.push(newDataPoint);

      // ensure that the array does not contain more than X data points
      while (chartData.datasets[0].data.length > this.MAX_NUMBER_OF_DATA_POINTS) {
        chartData.datasets[0].data.shift();
      }

      this.setState({ chartData });
    }
  }

  public render() {
    this.logger.debug('render');

    if (!this.props.show) {
      return (<React.Fragment />);
    }

    return (
      <div className='clg-application-detail-page--instances'>
        <div className='bx--row'>
          <div className='bx--col-lg-16 bx--col-md-8'>
            <div className='section'>
              <div className='application-section--content'>
                <LineChart data={this.state.chartData} options={this.state.chartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// WebStorm is unable to resolve .propTypes, even with @types/react installed. So we need the ts-ignore below to make WebStorm happy.

// @ts-ignore
ApplicationDetailInstances.propTypes = {
  appName: PropTypes.string.isRequired,
  runningInstances: PropTypes.array,
  show: PropTypes.bool.isRequired,
};

export default ApplicationDetailInstances;
