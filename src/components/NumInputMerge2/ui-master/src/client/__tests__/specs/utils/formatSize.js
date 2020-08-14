import formatSize from 'utils/formatSize';

describe('formatSize', () => {
  it('formats', () => {
    expect(formatSize({ virtualSize: 200 })).toEqual('200 B');
    expect(formatSize({ virtualSize: 2000 })).toEqual('2 KB');
    expect(formatSize({ virtualSize: 2000000 })).toEqual('2 MB');
    expect(formatSize({ virtualSize: 2000000000 })).toEqual('2 GB');
  });
});
