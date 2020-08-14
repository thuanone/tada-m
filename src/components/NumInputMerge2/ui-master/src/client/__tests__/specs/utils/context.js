import context from 'utils/context';
import nav from 'utils/nav';

describe('context', () => {
  it('gets default region', () => {
    expect(context.getDefaultRegion()).toBe('us-south');
  });

  it('gets metro', () => {
    spyOn(nav, 'getParam').and.returnValue('foo');
    expect(context.getMetro()).toBe('');
    nav.getParam.and.returnValue('us-east');
    expect(context.getMetro()).toBe('wdc');
    nav.getParam.and.returnValue('ibm:yp:jp-tok');
    expect(context.getMetro()).toBe('tok');
  });

  it('gets account id', () => {
    spyOn(window.header, 'whenAccountReady').and.callFake(cb => cb({ selectedAccountGuid: 'account-37' }));
    const callback = jasmine.createSpy();
    context.getAccountId(callback);
    expect(callback).toHaveBeenCalledWith('account-37');
    window.header.whenAccountReady.and.callFake(cb => cb({ account: { accountGuid: 'account-42' } }));
    context.getAccountId(callback);
    expect(callback).toHaveBeenCalledWith('account-42');
  });
});
