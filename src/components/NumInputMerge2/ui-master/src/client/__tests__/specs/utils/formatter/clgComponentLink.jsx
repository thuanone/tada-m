// tslint:disable:no-empty
import { shallow } from 'enzyme';

import { UIEntityKinds } from '../../../../../common/model/common-model';

import clgComponentLink from '../../../../utils/formatter/clgComponentLink';

describe('clgComponentLink', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(clgComponentLink.render(props));
    instance = wrapper.instance();
  };

  it('simple value', () => {
    let props = {
      foo: 'bar',
    };

    expect(clgComponentLink.value(props)).toEqual('-');
  });

  it('simple value (application)', () => {
      let props = {
        kind: UIEntityKinds.APPLICATION,
        publicServiceUrl: 'https://foo.bar.com',
      };
      expect(clgComponentLink.value(props)).toEqual(props.publicServiceUrl);
  });

  it('simple value (job)', () => {
    let props = {
      kind: UIEntityKinds.JOBDEFINITION,
      publicServiceUrl: 'https://foo.bar.com',
    };
    expect(clgComponentLink.value(props)).toEqual('-');

    props = {
      kind: UIEntityKinds.JOBRUN,
      regionId: 'some-region',
      projectId: 'some-project',
      definitionName: 'some-jobdef',
    };
    expect(clgComponentLink.value(props)).toEqual('/codeengine/project/some-region/some-project/jobdefinition/some-jobdef/configuration');
  });

  it('simple render', () => {
    let props = {
      kind: UIEntityKinds.APPLICATION,
      publicServiceUrl: 'https://foo.bar.com',
    };

    render(props);
    expect(wrapper.childAt(0).name()).toEqual('a');
    expect(wrapper.childAt(0).hasClass('bx--type-caption')).toBeTruthy();
    expect(wrapper.childAt(0).props().href).toEqual(props.publicServiceUrl);
  });

  it('simple render (empty value)', () => {
    const props = {
      kind: UIEntityKinds.JOBDEFINITION,
    };

    render(props);
    expect(wrapper.html()).toEqual('<span class="bx--type-caption">-</span>');
  });
});
