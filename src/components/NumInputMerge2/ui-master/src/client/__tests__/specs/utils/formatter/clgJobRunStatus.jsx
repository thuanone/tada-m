// tslint:disable:no-empty
import { shallow } from 'enzyme';

import * as jobModel from '../../../../../common/model/job-model';

import clgJobRunStatus from '../../../../utils/formatter/clgJobRunStatus';

describe('clgJobRunStatus', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(clgJobRunStatus.render(props));
    instance = wrapper.instance();
  };

  it('simple value', () => {
    let props = {

    };
    expect(clgJobRunStatus.value(props)).toEqual('clg.formatter.label.unknown');

    props = {
      status: jobModel.UIJobStatus.FAILED,
      isDeleting: true,
    };
    expect(clgJobRunStatus.value(props)).toEqual('clg.page.jobs.status.deleting');

    props = {
      status: jobModel.UIJobStatus.FAILED,
      isDeleting: false,
    };
    expect(clgJobRunStatus.value(props)).toEqual('clg.page.jobs.status.failed');

    props = {
      status: jobModel.UIJobStatus.SUCCEEDED,
      isDeleting: false,
    };
    expect(clgJobRunStatus.value(props)).toEqual('clg.page.jobs.status.succeeded');

    props = {
      status: jobModel.UIJobStatus.WAITING,
      isDeleting: false,
    };
    expect(clgJobRunStatus.value(props)).toEqual('clg.page.jobs.status.waiting');

    props = {
      status: jobModel.UIJobStatus.RUNNING,
      isDeleting: false,
      instanceStatus: 4,
    };
    expect(clgJobRunStatus.value(props)).toEqual('clg.page.jobs.status.running');
  });

  it('simple render', () => {
    const props = {
      status: jobModel.UIJobStatus.WAITING,
      isDeleting: true,
    };
    render(props);
    expect(wrapper.childAt(0).props().className).toEqual('clg-item--status-loading-small');
    expect(wrapper.childAt(1).props().className).toEqual('bx--type-caption clg-item--caption');
  });

  it('simple render (failed)', () => {
    const props = {
      status: jobModel.UIJobStatus.FAILED
    };
    render(props);
    expect(wrapper.childAt(0).name()).toEqual('ForwardRef(ErrorFilled24)');
    expect(wrapper.childAt(1).props().className).toEqual('bx--type-caption clg-item--caption');
  });

  it('simple render (succeeded)', () => {
    const props = {
      status: jobModel.UIJobStatus.SUCCEEDED
    };
    render(props);
    expect(wrapper.childAt(0).name()).toEqual('ForwardRef(CheckmarkFilled24)');
    expect(wrapper.childAt(1).props().className).toEqual('bx--type-caption clg-item--caption');
  });

  it('simple render (waiting)', () => {
    const props = {
      status: jobModel.UIJobStatus.WAITING
    };
    render(props);
    expect(wrapper.childAt(0).name()).toEqual('ForwardRef(Time24)');
    expect(wrapper.childAt(1).props().className).toEqual('bx--type-caption clg-item--caption');
  });


  it('simple render (running)', () => {
    const props = {
      status: jobModel.UIJobStatus.RUNNING,
      instanceStatus: 3,
    };
    render(props);
    expect(wrapper.childAt(0).name()).toEqual('ForwardRef(InProgress24)');
    expect(wrapper.childAt(1).props().className).toEqual('bx--type-caption clg-item--caption');
  });

  it('simple render (default)', () => {
    const props = {
      status: 'foo'
    };
    render(props);
    expect(wrapper.childAt(0).name()).toEqual('ForwardRef(Time24)');
    expect(wrapper.childAt(1).props().className).toEqual('bx--type-caption clg-item--caption');
  });
});
