// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import { ClgBuildRunDetailsRow } from '../../../../../view/components/ClgBuildRunDetailsRow/ClgBuildRunDetailsRow';
import * as buildModel from '../../../../../../common/model/build-model';

describe('ClgBuildRunDetailsRow', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<ClgBuildRunDetailsRow {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      item: {
        completed: Date.now() - (1000 * 10),
        created: Date.now() - (1000 * 15),
      }
    };

    render(props);
    expect(wrapper.html()).toContain('buildrun-details--table__row');
    expect(wrapper.html()).not.toContain('buildrun-status--instance-details');
  });

  it('simple render - with failed details', () => {
    const props = {
      item: {
        completed: Date.now() - (1000 * 10),
        created: Date.now() - (1000 * 15),
        status: buildModel.UIBuildRunStatus.FAILED,
        reason: 'foobar' 
      }
    };

    render(props);
    expect(wrapper.html()).toContain('buildrun-details--table__row');
    expect(wrapper.html()).toContain('buildrun-status--instance-details');
    expect(wrapper.html()).toContain('foobar');
  });
});
