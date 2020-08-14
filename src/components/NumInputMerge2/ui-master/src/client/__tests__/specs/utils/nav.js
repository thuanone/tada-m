import nav from 'utils/nav';
import win from 'utils/window';

describe('nav', () => {
  it('gets query parameter', () => {
    spyOn(win, 'get').and.callFake(key => {
      if (key === 'location.search') return 'country=USA&region=region1';
      return null;
    });
    expect(nav.getParam('region')).toBe('region1');
  });

  it('attempts to get a param that doesnt exist', () => {
    spyOn(win, 'get').and.callFake(key => {
      if (key === 'location.search') return 'env=ibm:ys1:us-south';
      return null;
    });
    expect(nav.getParam('fake')).toBe('');
  });

  it('gets a param that is set to "undefined"', () => {
    spyOn(win, 'get').and.callFake(key => {
      if (key === 'location.search') return 'env=ibm:ys1:us-south&resourceGroup=undefined';
      return null;
    });
    expect(nav.getParam('resourceGroup')).toBe('');
  });
});
