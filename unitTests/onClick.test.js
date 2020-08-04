const onClick = require('./onClick');

const props = {
    value: 0,
    unitAssociated:['mb','gb'],
    minVal: 0,
    maxVal: 10,
    standardStepSizes:[1,0.25],
    standardChunks:[128, 0.5],
    unitInUsePTR: 0,
    allowMultipleUnits: false,
    conversionToBiggerSize: [1024,1]

} 
const state = {
    value: '0',
    unitInUsePTR: 0,
    isValid: true,
    errorMessage: '',

}

console.log(state, props);
test('increments a number', () => {
    expect(onClick.increment(1, state, props))
    .toEqual(
        expect.arrayContaining([expect.any(Number), expect.any(Boolean)])
    );
});