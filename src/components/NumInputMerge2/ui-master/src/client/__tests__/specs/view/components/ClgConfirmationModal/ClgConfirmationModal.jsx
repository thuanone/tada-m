// tslint:disable:no-empty
import * as React from 'react';
import { shallow } from 'enzyme';

import ClgConfirmationModal from '../../../../../view/components/ClgConfirmationModal/ClgConfirmationModal';

describe('ClgConfirmationModal', () => {
  let wrapper;
  let instance;

  const render = overrides => {
    const props = Object.assign({}, overrides || {});
    wrapper = shallow(<ClgConfirmationModal {...props} />);
    instance = wrapper.instance();
  };

  it('simple render of a modal', () => {
    const props = {
      isDanger: false,
      onSubmitHandler: () => { },
      onCancelHandler: () => { },
      heading: 'some-heading',
      isOpen: true,
      isSubmitting: false,
      primaryBtnText: 'some-primary-btn-text',
      secondaryBtnText: 'some-secondary-btn-text',
      size: 'sm',  // xs, sm, lg
      messages: ['some-message']
    };

    render(props);
    // we are expecting a <div class="bx--modal bx--modal-tall is-visible">...</div>
    expect(wrapper.childAt(0).name()).toBe('div');
  });

  it('simple render of a danger modal', () => {
    const props = {
      isDanger: true,
      onSubmitHandler: () => { },
      onCancelHandler: () => { },
      heading: 'some-heading',
      isOpen: true,
      isSubmitting: false,
      primaryBtnText: 'some-primary-btn-text',
      secondaryBtnText: 'some-secondary-btn-text',
      size: 'sm',  // xs, sm, md, lg
      messages: ['some-message']
    };

    render(props);
    expect(wrapper.childAt(0).hasClass('bx--modal-content__text')).toBeTruthy();
    expect(wrapper.childAt(0).children().length).toEqual(1);
    expect(wrapper.childAt(0).childAt(0).hasClass('clg-modal-message-paragraph')).toBeTruthy();
  });

  it('simple render of a modal with confirmation check', () => {
    const props = {
      addConfirmationCheck: true,
      isDanger: true,
      onSubmitHandler: () => { },
      onCancelHandler: () => { },
      heading: 'some-heading',
      isOpen: true,
      isSubmitting: false,
      primaryBtnText: 'some-primary-btn-text',
      secondaryBtnText: 'some-secondary-btn-text',
      size: 'sm',  // xs, sm, md, lg
      messages: ['some-message']
    };

    render(props);
    expect(wrapper.childAt(0).hasClass('bx--modal-content__text')).toBeTruthy();
    expect(wrapper.childAt(0).children().length).toEqual(2);
    expect(wrapper.childAt(0).childAt(0).hasClass('clg-modal-message-paragraph')).toBeTruthy();
    expect(wrapper.childAt(0).childAt(1).name('div')).toBeTruthy();
    expect(wrapper.childAt(0).childAt(1).hasClass('confirmation-check')).toBeTruthy();
  });
});
