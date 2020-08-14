import * as date from 'utils/date';

describe('date', () => {
  it('toIso', () => {
    expect(date.toIso()).toBeNull();
    expect(date.toIso(123)).toBeNull();
    expect(date.toIso(['foo'])).toBeNull();
    expect(date.toIso('foo')).toBeNull();
    expect(date.toIso('20170206162432')).toBe('2017-02-06T16:24:32Z');
    expect(date.toIso('2017-02-06T16:24:32Z')).toBe('2017-02-06T16:24:32Z');
    expect(date.toIso('2017-02-06T16:24:32-0700')).toBe('2017-02-06T16:24:32-0700');
  });

  it('format', () => {
    expect(date.format()).toBeUndefined();
    expect(date.format('foo')).toEqual('foo');
    expect(date.format('20170206162432'))
      .toEqual(new Date('2017-02-06T16:24:32Z').toLocaleDateString());
    expect(date.format(123)).toEqual(new Date(123).toLocaleDateString());
    expect(date.format(123.4)).toEqual(123.4);
  });
});
