// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgJobRunDetailsTable from '../../../../../view/components/ClgJobRunDetailsTable/ClgJobRunDetailsTable';

describe('ClgJobRunDetailsTable', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({ }, overrides || {});
    wrapper = shallow(<ClgJobRunDetailsTable {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      getUpdateCacheFnRef: (fn) => {},
      history: { push: (some) => {} },
      jobDefinitionName: 'some-jobdef-name',
      regionId: 'some-region',
      projectId: 'some-project',
      errorHandler: (error) => {},
      onGetJobRunInfo: (jobInfo) => {},
    };

    render(props);
    expect(wrapper.childAt(0).hasClass('clg-grid-nested')).toEqual(true);
  });
});
