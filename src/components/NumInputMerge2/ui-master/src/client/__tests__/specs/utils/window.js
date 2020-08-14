import win from 'utils/window';
import modal from 'utils/modal';

describe('window wrapper', () => {
  it('get', () => {
    expect(win.get()).toBe(window);
    expect(win.get('location.pathname')).toBe(window.location.pathname);
    expect(win.get('a.b.c')).toBeNull();
  });

  it('set', () => {
    win.set('foo', 'bar');
    expect(window.foo).toBe('bar');
    win.set('armada.foo', 'bar');
    expect(window.armada.foo).toBe('bar');
    win.set();
  });

  it('open', () => {
    // see the window spec for further details: https://developer.mozilla.org/en-US/docs/Web/API/Window/open
    spyOn(window, 'open').and.returnValue({ opener: { name : 'SourceWindow'}});
    spyOn(modal, 'info');
    const msg = 'Unable to open new window';
    win.open('https://www.ibm.com', msg);
    expect(modal.info).not.toHaveBeenCalled();
    window.open.and.returnValue(null);
    win.open('https://www.ibm.com', msg);
    expect(modal.info).toHaveBeenCalledWith({
      title: 'Pop-up blocked?',
      message: msg,
    });
  });

  it('timeout', () => {
    spyOn(window, 'setTimeout');
    const callback = () => {};
    win.timeout(callback, 10);
    expect(window.setTimeout).toHaveBeenCalledWith(callback, 10);
  });
});
