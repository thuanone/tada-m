
import * as memoryUtils from '../../../../common/utils/memory-utils';

describe('common memory utils', () => {

  it('can handle undefined and empty input', () => {
    const expectedResult =  0;
    let result = memoryUtils.convertValueToBytes('');
    expect(result).toEqual(expectedResult);

    result = memoryUtils.convertValueToBytes(undefined);
    expect(result).toEqual(expectedResult);

    result = memoryUtils.convertValueToBytes('0');
    expect(result).toEqual(expectedResult);
  });

  it('converts 536870912', () => {
    const expectedResult =  536870912;
    const result = memoryUtils.convertValueToBytes('536870912');
    expect(result).toEqual(expectedResult);
  });

  it('converts 512 Mebibytes', () => {
    const expectedResult =  536870912;
    let result = memoryUtils.convertValueToBytes('512Mi');
    expect(result).toEqual(expectedResult);

    result = memoryUtils.convertValueToBytes('512 Mi');
    expect(result).toEqual(expectedResult);

    result = memoryUtils.convertValueToBytes('512 MiB');
    expect(result).toEqual(expectedResult);

    result = memoryUtils.convertValueToBytes('512 mib');
    expect(result).toEqual(expectedResult);
  });

  it('converts 500 Megabytes', () => {
    const expectedResult =  500000000;
    let result = memoryUtils.convertValueToBytes('500MB');
    expect(result).toEqual(expectedResult);

    result = memoryUtils.convertValueToBytes('500 MB');
    expect(result).toEqual(expectedResult);

    result = memoryUtils.convertValueToBytes('500 M');
    expect(result).toEqual(expectedResult);

    result = memoryUtils.convertValueToBytes('500M');
    expect(result).toEqual(expectedResult);

    result = memoryUtils.convertValueToBytes('500m');
    expect(result).toEqual(expectedResult);

    result = memoryUtils.convertValueToBytes('500 m');
    expect(result).toEqual(expectedResult);

    result = memoryUtils.convertValueToBytes('500 mb');
    expect(result).toEqual(expectedResult);
  });

  it('converts 4 Gibibytes', () => {
    const expectedResult =  4294967296;
    const result = memoryUtils.convertValueToBytes('4Gi');
    expect(result).toEqual(expectedResult);
  });

  it('converts 4 Gigabytes', () => {
    const expectedResult =  4000000000;
    const result = memoryUtils.convertValueToBytes('4G');
    expect(result).toEqual(expectedResult);
  });

  it('converts 1.5 Gigabytes', () => {
    const expectedResult =  1500000000;
    const result = memoryUtils.convertValueToBytes('1.5GB');
    expect(result).toEqual(expectedResult);
  });

  it('converts 5 Tebibytes', () => {
    const expectedResult =  5497558138880;
    const result = memoryUtils.convertValueToBytes('5Ti');
    expect(result).toEqual(expectedResult);
  });

  it('converts 5 Terabytes', () => {
    const expectedResult =  5000000000000;
    const result = memoryUtils.convertValueToBytes('5TB');
    expect(result).toEqual(expectedResult);
  });

  it('converts 6 Pebibytes', () => {
    const expectedResult =  6755399441055744;
    const result = memoryUtils.convertValueToBytes('6Pi');
    expect(result).toEqual(expectedResult);
  });

  it('converts 6 Petabytes', () => {
    const expectedResult =  6000000000000000;
    const result = memoryUtils.convertValueToBytes('6pb');
    expect(result).toEqual(expectedResult);
  });

  it('converts 7 Exbibytes', () => {
    const expectedResult =  8070450532247929000;
    const result = memoryUtils.convertValueToBytes('7Ei');
    expect(result).toEqual(expectedResult);
  });

  it('converts 7 Exabytes', () => {
    const expectedResult =  7000000000000000000;
    const result = memoryUtils.convertValueToBytes('7E');
    expect(result).toEqual(expectedResult);
  });

  it('converts 500000000 to 500 M correctly', () => {
    const expectedResult =  '500 M';
    let result = memoryUtils.convertNumberToDisplayValueAndUnit(500000000);
    expect(result).toEqual(expectedResult);

    // double check whether the default uses SI units
    result = memoryUtils.convertNumberToDisplayValueAndUnit(500000000, true);
    expect(result).toEqual(expectedResult);
  });

  it('displays 186300000000 to 186.3 G correctly', () => {
    const expectedResult =  '186.3 G';
    const result = memoryUtils.convertNumberToDisplayValueAndUnit(186300000000);
    expect(result).toEqual(expectedResult);
  });

  it('converts 536870912 to 512 Mi correctly', () => {
    const expectedResult =  '512 Mi';
    const result = memoryUtils.convertNumberToDisplayValueAndUnit(536870912, false);
    expect(result).toEqual(expectedResult);
  });

  it('converts 1536870912 to 1.431 Gi correctly', () => {
    const expectedResult =  '1.431 Gi';
    const result = memoryUtils.convertNumberToDisplayValueAndUnit(1536870912, false);
    expect(result).toEqual(expectedResult);
  });

  it('returns a dash, if the value is undefined or NaN', () => {
    const expectedResult =  '-';
    let result = memoryUtils.convertNumberToDisplayValueAndUnit(undefined);
    expect(result).toEqual(expectedResult);

    result = memoryUtils.convertNumberToDisplayValueAndUnit('abs');
    expect(result).toEqual(expectedResult);
  });
});
