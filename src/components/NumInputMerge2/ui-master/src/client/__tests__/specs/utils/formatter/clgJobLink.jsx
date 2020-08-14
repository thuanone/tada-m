// tslint:disable:no-empty
import { shallow } from 'enzyme';

import { UIEntityKinds } from '../../../../../common/model/common-model';

import clgJobLink from '../../../../utils/formatter/clgJobLink';

describe('clgJobLink', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(clgJobLink.render(props));
    instance = wrapper.instance();
  };

  it('simple value (job)', () => {
    const props = {
      kind: UIEntityKinds.JOBRUN,
      regionId: 'some-region',
      projectId: 'some-project',
      definitionName: 'some-jobdef',
    };
    expect(clgJobLink.value(props)).toEqual('/codeengine/project/some-region/some-project/jobdefinition/some-jobdef/configuration');
  });

  it('simple render', () => {
    const props = { };

    render(props);
    expect(wrapper.html()).toEqual('<div><span class="bx--type-caption">-</span></div>');
  });

  it('simple render (only name)', () => {
    const props = {
      definitionName: 'foo-bar',
    };

    render(props);
    expect(wrapper.childAt(0).props().className).toEqual('bx--type-caption');
    expect(wrapper.childAt(0).name()).toEqual('Link');
  });

  it('simple render (name + url)', () => {
    const props = {
      definitionName: 'foo-bar',
      regionId: 'foo-region',
      projectId: 'foo-project'
    };

    render(props);
    expect(wrapper.childAt(0).props().className).toEqual('bx--type-caption');
    expect(wrapper.childAt(0).name()).toEqual('Link');
  });
});
