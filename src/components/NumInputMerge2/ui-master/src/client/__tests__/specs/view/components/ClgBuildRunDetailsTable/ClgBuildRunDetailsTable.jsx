// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgBuildRunDetailsTable from '../../../../../view/components/ClgBuildRunDetailsTable/ClgBuildRunDetailsTable';

describe('ClgBuildRunDetailsTable', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<ClgBuildRunDetailsTable {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      getUpdateCacheFnRef: (fn) => {},
      history: { push: (some) => {} },
      buildName: 'some-build-name',
      regionId: 'some-region',
      projectId: 'some-project',
      errorHandler: (error) => {},
    };

    render(props);
    expect(wrapper.hasClass('buildrun-details--table')).toEqual(true);
    expect(wrapper.childAt(0).hasClass('clg-grid-nested')).toEqual(true);
  });

  it('simple render - empty list of items', () => {
    const props = {
      getUpdateCacheFnRef: (fn) => {},
      history: { push: (some) => {} },
      buildName: 'some-build-name',
      regionId: 'some-region',
      projectId: 'some-project',
      errorHandler: (error) => {},
    };

    render(props);
    expect(wrapper.hasClass('buildrun-details--table')).toEqual(true);
    expect(wrapper.childAt(0).hasClass('clg-grid-nested')).toEqual(true);

    instance.onBuildRunsLoaded([]);
    wrapper.update();
    expect(wrapper.hasClass('buildrun-details--table')).toEqual(true);
    expect(wrapper.childAt(0).hasClass('build--no-buildruns')).toEqual(true);

    instance.onBuildRunsLoaded([{id: 'foo'}]);
    wrapper.update();
    expect(wrapper.hasClass('buildrun-details--table')).toEqual(true);
    expect(wrapper.childAt(0).hasClass('clg-grid-nested')).toEqual(true);
  });

  it('simple render - list has one item item', () => {
    const props = {
      getUpdateCacheFnRef: (fn) => {},
      history: { push: (some) => {} },
      buildName: 'some-build-name',
      regionId: 'some-region',
      projectId: 'some-project',
      errorHandler: (error) => {},
    };

    render(props);
    expect(wrapper.hasClass('buildrun-details--table')).toEqual(true);
    expect(wrapper.childAt(0).hasClass('clg-grid-nested')).toEqual(true);

    instance.onBuildRunsLoaded([{id: 'foo'}]);
    wrapper.update();
    expect(wrapper.hasClass('buildrun-details--table')).toEqual(true);
    expect(wrapper.childAt(0).hasClass('clg-grid-nested')).toEqual(true);
  });

  it('simple render - open the delete modal of an item', () => {
    const props = {
      getUpdateCacheFnRef: (fn) => {},
      history: { push: (some) => {} },
      buildName: 'some-build-name',
      regionId: 'some-region',
      projectId: 'some-project',
      errorHandler: (error) => {},
    };

    render(props);
    expect(wrapper.hasClass('buildrun-details--table')).toEqual(true);
    expect(wrapper.childAt(0).hasClass('clg-grid-nested')).toEqual(true);

    instance.onBuildRunsLoaded([{id: 'foo'}]);
    wrapper.update();
    expect(wrapper.hasClass('buildrun-details--table')).toEqual(true);
    expect(wrapper.childAt(0).hasClass('clg-grid-nested')).toEqual(true);

    instance.deleteItemHandler({id: 'foo'});
    wrapper.update();
  });
});
