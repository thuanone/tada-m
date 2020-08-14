// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgTableWrapper from '../../../../../view/components/ClgTableWrapper/ClgTableWrapper';

describe('ClgTableWrapper', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<ClgTableWrapper {...props} />);
    instance = wrapper.instance();
  };

  it('loading render', () => {
    const props = {
      columns: [{ field: 'name', label: 'Name' }, { field: 'type', label: 'Type' }, { field: 'time', label: 'Expiration' }],
      id: 'myTable',
      title: 'testTable',
      items: null,
    };

    render(props);

    expect(wrapper.find('TableContainer > DataTableSkeleton')).toHaveLength(1);
  });

  it('empty render', () => {
    const props = {
      columns: [{ field: 'name', label: 'Name' }, { field: 'type', label: 'Type' }, { field: 'time', label: 'Expiration' }],
      id: 'myTable',
      title: 'testTable',
      items: [],
    };

    render(props);
    expect(wrapper.find('TableContainer > DataTableSkeleton')).toHaveLength(0);
    expect(wrapper.exists('TableContainer > table.clg-table-emptystate')).toBeTruthy();
  });
});
