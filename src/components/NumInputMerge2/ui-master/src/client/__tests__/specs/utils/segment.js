import win from 'utils/window';
import { pageEvent, trackEvent } from 'utils/segment';
import context from 'utils/context';
import { SegmentEventTypes } from '../../../../common/model/common-model';

describe('trackEvent', () => {
  beforeEach(() => {
    spyOn(context, 'getRegion').and.returnValue('region-1');
    spyOn(context, 'getAccountData').and.callFake(cb => cb({ account: { type: 'trial' } }));
  });

  it('trackEvent', () => {
    const defaultProps = {
      field: 'field',
      action: 'action',
      data: 'data',
      milestoneName: 'milestone',
    };
    spyOn(window.bluemixAnalytics, 'trackEvent').and.callThrough();
    trackEvent(SegmentEventTypes.CREATED, defaultProps);
    expect(window.bluemixAnalytics.trackEvent).
    toHaveBeenCalledWith('Created Object', {
      field: 'field',
      action: 'action',
      data: 'data',
      productTitle: 'Code Engine',
      category: 'Offering Interface',
      environment: 'stage',
      region: 'region-1',
      milestoneName: 'milestone',
    });
    window.bluemixAnalytics.trackEvent.calls.reset();

    window.armada.consoleEnv = 'prod';
    trackEvent(SegmentEventTypes.CREATED, defaultProps);
    expect(window.bluemixAnalytics.trackEvent.calls.argsFor(0)[1].environment).toBe('prod');
  });

  it('tracks external staging', () => {
    const defaultProps = {
      field: 'field',
      action: 'action',
      data: 'data',
      milestoneName: 'milestone',
      accountPlan: 'Trial',
    };
    window.armada.userEmail = 'external@gmail.com';
    spyOn(win, 'get').and.callFake(key => {
      if (key === 'location.href') return 'stage1';
      if (key === 'armada') return window.armada;
      if (key === 'bluemixAnalytics') return window.bluemixAnalytics;
      return null;
    });
    spyOn(window.bluemixAnalytics, 'trackEvent').and.callThrough();
    trackEvent(SegmentEventTypes.CREATED, defaultProps);
    expect(window.bluemixAnalytics.trackEvent).
    toHaveBeenCalledWith('Created Object', {
      accountPlan: 'Trial',
      field: 'field',
      action: 'action',
      data: 'data',
      productTitle: 'Code Engine',
      category: 'Offering Interface',
      environment: 'stage',
      region: 'region-1',
      milestoneName: 'milestone',
    });
    window.bluemixAnalytics.trackEvent.calls.reset();

    context.getRegion.and.returnValue(null);
    context.getAccountData.and.callFake(cb => cb());

    delete window.armada.consoleEnv;
      trackEvent(SegmentEventTypes.CREATED, defaultProps);
      expect(window.bluemixAnalytics.trackEvent.calls.argsFor(0)[1].accountPlan).toBe('Trial');
      expect(window.bluemixAnalytics.trackEvent.calls.argsFor(0)[1].region).toBeNull();
      window.bluemixAnalytics.trackEvent.calls.reset();

      const origTrackEvent = window.bluemixAnalytics.trackEvent;
      delete window.bluemixAnalytics.trackEvent;
      trackEvent(SegmentEventTypes.CREATED, defaultProps);
      window.bluemixAnalytics.trackEvent = origTrackEvent;
    });
  });

  describe('pageEvent', () => {
    it('pageEvent', () => {
      spyOn(window.bluemixAnalytics, 'pageEvent').and.callThrough();
      pageEvent('category', 'name');
      expect(window.bluemixAnalytics.pageEvent).
      toHaveBeenCalledWith('category', 'name');
    // For coverage
    spyOn(win, 'get').and.returnValue(null);
    pageEvent();
  });
});

describe('analytics not defined', () => {
  it('checks to see if analytics is defined', () => {
    spyOn(win, 'get').and.returnValue(undefined);
    expect(trackEvent(SegmentEventTypes.CREATED, {})).toBe(undefined);
  });
});
