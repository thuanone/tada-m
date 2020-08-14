// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import { ClgJobRunDetailsRow } from '../../../../../view/components/ClgJobRunDetailsRow/ClgJobRunDetailsRow';

describe('ClgJobRunDetailsRow', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<ClgJobRunDetailsRow {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      item: {
        completed: Date.now() - (1000 * 10),
        created: Date.now() - (1000 * 15),
        instanceStatus: {
          numFailed: 0,
          numRunning: 0,
          numSucceeded: 10,
          numWaiting: 0,
        }
      }
    };

    render(props);
    expect(wrapper.html()).toContain('jobrun-details--table__row');
  });
});
