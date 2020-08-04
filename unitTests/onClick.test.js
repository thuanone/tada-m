const onClick = require('./onClick');

const props = {
    value: 0,
    unitAssociated: ['mb', 'gb'],
    minVal: 0,
    maxVal: 10,
    standardStepSizes: [1, 0.25],
    standardChunks: [128, 0.5],
    unitInUsePTR: 0,
    allowMultipleUnits: false,
    conversionToBiggerSize: [1024, 1]

}
const state = {
    value: '0',
    unitInUsePTR: 0,
    isValid: true,
    errorMessage: '',

}

test('increment(): increments a number', () => {
    const number = 1;
    const newNumber = onClick.increment(number, state, props)[0];
    const newUnit = onClick.increment(number, state, props)[1];

    expect(onClick.increment(number, state, props))
        .toEqual(
            expect.arrayContaining([expect.any(Number), expect.any(Boolean)])
        );
    expect(newNumber).toBeGreaterThan(number);
    expect(newUnit).toBeFalsy();
});

test('increment(): converts 1023 to 1 on increment', () => {
    const number = 1023;
    const newNumber = onClick.increment(number, state, props)[0];
    const newUnit = onClick.increment(number, state, props)[1];
    console.log(props.conversionToBiggerSize[state.unitInUsePTR]);
    expect(onClick.increment(number, state, props))
        .toEqual(
            expect.arrayContaining([expect.any(Number), expect.any(Boolean)])
        );
    expect(newNumber).not.toBeGreaterThan(number);
    expect(newUnit).toBeTruthy();
});

test('decrement(): decrements a number', () => {
    const number = 0;
    const newNumber = onClick.decrement(number, state, props)[0];

    expect(onClick.increment(number, state, props))
        .toEqual(
            expect.arrayContaining([expect.any(Number), expect.any(Boolean)])
        );
    expect(newNumber).toBeLessThan(number);
    
});


test('extracts number out of a string', () => {
    expect(onClick.getNumber('12923 mm m mg')).toEqual(expect.any(Number));
});