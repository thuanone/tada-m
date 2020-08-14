// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import {ClgProjectSelector} from '../../../../../view/components/ClgProjectSelector/ClgProjectSelector';

describe('ClgProjectSelector', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<ClgProjectSelector {...props} />);
    instance = wrapper.instance();
  };

  it('simple render', () => {
    const props = {
      onError: () => {},
      onSelectProject: () => {},
    };

    render(props);
    expect(wrapper.html()).toContain('clg-project-selector');
  });

  it('render - empty state', () => {
    const props = {
      onError: () => {},
      onSelectProject: () => {},
    };

    render(props);
    instance.onProjectsLoaded([]);
    wrapper.update();
    expect(wrapper.html()).toContain('clg-project-selector');
    expect(wrapper.html()).toContain('clg.component.projectSelector.info.noprojects.title');
  });

  it('render - loaded one project', () => {
    const props = {
      onError: () => {},
      onSelectProject: () => {},
    };

    render(props);
    instance.onProjectsLoaded([{name: 'foo', region: 'us-south'}]);
    wrapper.update();
    expect(wrapper.html()).toContain('clg-project-selector');
    expect(wrapper.html()).toContain('foo (us-south)');
  });

  it('render - loading failed', () => {
    const props = {
      onError: () => {},
      onSelectProject: () => {},
    };

    render(props);
    instance.onProjectsLoadingFailed(new Error('foo'));
    wrapper.update();
    expect(wrapper.html()).toContain('clg-project-selector');
    expect(wrapper.html()).toContain('bx--label bx--label--disabled'); // in case of an error the dropdown will be disabled
  });
});
