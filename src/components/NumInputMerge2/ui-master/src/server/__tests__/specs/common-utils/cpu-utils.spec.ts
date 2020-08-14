import * as cpuUtils from '../../../../common/utils/cpu-utils';

describe('common memory utils', () => {

  it('can handle undefined and empty input', () => {
    const expectedResult =  0;
    let result = cpuUtils.convertValueToFloat('');
    expect(result).toEqual(expectedResult);

    result = cpuUtils.convertValueToFloat(undefined);
    expect(result).toEqual(expectedResult);

    result = cpuUtils.convertValueToFloat('0');
    expect(result).toEqual(expectedResult);
  });

  it('converts absolute number', () => {
    const expectedResult =  8;
    const result = cpuUtils.convertValueToFloat('8');
    expect(result).toEqual(expectedResult);
  });

  it('converts floating number', () => {
    const expectedResult =  8.1;
    const result = cpuUtils.convertValueToFloat('8.1');
    expect(result).toEqual(expectedResult);
  });

  it('rejects negative numbers', () => {
    const expectedResult = 0;
    const result = cpuUtils.convertValueToFloat('-1');
    expect(result).toEqual(expectedResult);
  });

  it('rejects 8e2 number', () => {
    const expectedResult =  0;
    const result = cpuUtils.convertValueToFloat('8e2');
    expect(result).toEqual(expectedResult);
  });

  it('rejects strings', () => {
    const expectedResult =  0;
    const result = cpuUtils.convertValueToFloat('m');
    expect(result).toEqual(expectedResult);
  });

  it('rejects comma strings', () => {
    const expectedResult =  0;
    const result = cpuUtils.convertValueToFloat('1,1');
    expect(result).toEqual(expectedResult);
  });

  it('converts 100m -> 0.1', () => {
    const expectedResult =  0.1;
    const result = cpuUtils.convertValueToFloat('100m');
    expect(result).toEqual(expectedResult);
  });

  it('converts 100m -> 0.1', () => {
    const expectedResult =  0.1;
    const result = cpuUtils.convertValueToFloat('100m');
    expect(result).toEqual(expectedResult);
  });

  it('converts 10000000m -> 10000', () => {
    const expectedResult =  10000;
    const result = cpuUtils.convertValueToFloat('10000000m');
    expect(result).toEqual(expectedResult);
  });

  it('converts 1000m -> 1', () => {
    const expectedResult =  1;
    const result = cpuUtils.convertValueToFloat('1000m');
    expect(result).toEqual(expectedResult);
  });

  it('converts 0815m -> 1', () => {
    const expectedResult =  0.815;
    const result = cpuUtils.convertValueToFloat('0815m');
    expect(result).toEqual(expectedResult);
  });

  it('converts 1m -> 0.001', () => {
    const expectedResult =  0.001;
    const result = cpuUtils.convertValueToFloat('1m');
    expect(result).toEqual(expectedResult);
  });

  it('converts 10m -> 0.01', () => {
    const expectedResult =  0.01;
    const result = cpuUtils.convertValueToFloat('10m');
    expect(result).toEqual(expectedResult);
  });
});
