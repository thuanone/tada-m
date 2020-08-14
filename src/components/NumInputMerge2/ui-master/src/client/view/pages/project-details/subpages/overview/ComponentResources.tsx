// react
import PropTypes from 'prop-types';
import React from 'react';

// 3rd-party
import * as log from 'loglevel';

// carbon + pal
import { DonutChart } from '@carbon/charts-react';

// coligo
import * as projModel from '../../../../../../common/model/project-model';
import * as memoryUtils from '../../../../../../common/utils/memory-utils';
import t from '../../../../../utils/i18n';

interface IProps {
  show: boolean;
  projectConsumptionInfo: projModel.IUIProjectConsumptionInfo;
}

interface IState {
  instancesChartData: any[];
  instancesChartOptions: any;
  memoryChartData: any[];
  memoryChartOptions: any;
  cpusChartData: any[];
  cpusChartOptions: any;
  timestamp: number;
}

class ComponentResources extends React.Component<IProps, IState> {
  private readonly COMPONENT = 'ComponentResources';
  private readonly MEMORY_UNIT: string = 'mi';

  // setup the logger
  private logger = log.getLogger(this.COMPONENT);

  private readonly MAX_NUMBER_OF_DATA_POINTS = 500;

  constructor(props) {
    super(props);

    const dummyData = [
      {
        group: t('clg.components.type.applications'),
        value: 0,
      },
      {
        group: t('clg.components.type.buildruns'),
        value: 0,
      },
      {
        group: t('clg.components.type.jobruns'),
        value: 0,
      },
    ];

    this.state = {
      instancesChartData: dummyData,
      instancesChartOptions: {
        resizable: true,
        legend: {
          enabled: false,
        },
        donut: {
          center: {
            label: t('clg.page.project.resources.instances'),
          },
        },
        height: '200px',
      },

      memoryChartData: dummyData,
      memoryChartOptions: {
        resizable: true,
        legend: {
          enabled: false,
        },
        donut: {
          center: {
            label: t('clg.page.project.resources.memory'),
          },
        },
        height: '200px',
      },

      cpusChartData: dummyData,
      cpusChartOptions: {
        resizable: true,
        legend: {
          enabled: false,
        },
        donut: {
          center: {
            label: t('clg.page.project.resources.cpus'),
          },
        },
        height: '200px',
      },
      timestamp: 0,
    };

    this.setCharts = this.setCharts.bind(this);
  }

  public componentDidMount() {
    this.logger.debug('componentDidMount');
    if (this.props.projectConsumptionInfo) {
      this.setCharts(this.props.projectConsumptionInfo);
    }
  }

  public UNSAFE_componentWillReceiveProps(newProps: IProps) {
    this.logger.debug('componentWillReceiveProps');

    if (newProps.projectConsumptionInfo && newProps.projectConsumptionInfo.timestamp > this.state.timestamp) {
      this.setCharts(newProps.projectConsumptionInfo);
    }
  }

  public setCharts(projectConsumptionInfo: projModel.IUIProjectConsumptionInfo) {
    this.logger.debug('setCharts');
    const instancesChartData = [
      {
        group: t('clg.components.type.applications'),
        value: projectConsumptionInfo.numberOfAppInstances,
      },
      {
        group: t('clg.components.type.buildruns'),
        value: projectConsumptionInfo.numberOfBuildInstances,
      },
      {
        group: t('clg.components.type.jobruns'),
        value: projectConsumptionInfo.numberOfJobInstances,
      },
    ];

    const memoryChartData = [
      {
        group: t('clg.components.type.applications'),
        value: memoryUtils.convertBytesToUnit(projectConsumptionInfo.memoryOfAppInstances, this.MEMORY_UNIT),
      },
      {
        group: t('clg.components.type.buildruns'),
        value: memoryUtils.convertBytesToUnit(projectConsumptionInfo.memoryOfBuildInstances, this.MEMORY_UNIT),
      },
      {
        group: t('clg.components.type.jobruns'),
        value: memoryUtils.convertBytesToUnit(projectConsumptionInfo.memoryOfJobInstances, this.MEMORY_UNIT),
      },
    ];

    const cpusChartData = [
      {
        group: t('clg.components.type.applications'),
        value: projectConsumptionInfo.cpusOfAppInstances,
      },
      {
        group: t('clg.components.type.buildruns'),
        value: projectConsumptionInfo.cpusOfBuildInstances,
      },
      {
        group: t('clg.components.type.jobruns'),
        value: projectConsumptionInfo.cpusOfJobInstances,
      },
    ];
    this.setState({ instancesChartData, memoryChartData, cpusChartData, timestamp: projectConsumptionInfo.timestamp });
  }

  public render() {
    this.logger.debug('render');

    if (!this.props.show) {
      return (<React.Fragment />);
    }

    return (
      <div className='clg-project-detail-page--instances'>
        <div className='bx--row'>
          <div className='bx--col-lg-5 bx--col-md-4'>
            <div className='section'>
              <div className='project-detail-section--content'>
                <DonutChart data={this.state.instancesChartData} options={this.state.instancesChartOptions} />
              </div>
            </div>
          </div>
          <div className='bx--col-lg-5 bx--col-md-4'>
            <div className='section'>
              <div className='project-detail-section--content'>
                <DonutChart data={this.state.memoryChartData} options={this.state.memoryChartOptions} />
              </div>
            </div>
          </div>
          <div className='bx--col-lg-5 bx--col-md-4'>
            <div className='section'>
              <div className='project-detail-section--content'>
                <DonutChart data={this.state.cpusChartData} options={this.state.cpusChartOptions} />
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
ComponentResources.propTypes = {
  projectConsumptionInfo: PropTypes.object,
  show: PropTypes.bool.isRequired,
};

export default ComponentResources;
