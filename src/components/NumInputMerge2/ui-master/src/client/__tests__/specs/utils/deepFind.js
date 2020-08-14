import deepFind from 'utils/deepFind';

describe('deepFind utils', () => {
  it('works', () => {
    const testObj = {
      a: {
        b: {
          c: 'value',
        },
      },
    };
    const test1 = deepFind(testObj, 'a.b.c');
    expect(test1).toBe('value');

    const test2 = deepFind(testObj, 'x.y.z');
    expect(test2).toBe(undefined);
  });
});
