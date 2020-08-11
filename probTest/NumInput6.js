/*
import React from 'react';
import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import NumInputForm6 from '../components/NumInputThuan6/NumInput6';


Enzyme.configure({ adapter: new Adapter() });

const Memory_Unit= {
    value: '0',
    unitAssociated:['mb','gb'],
    minVal: 0,
    maxVal: 10,
    standardStepSizes:[1,0.25],
    standardChunks:[128, 0.5],
    unitInUsePTR: 0,
    allowMultipleUnits: false,
    conversionToBiggerSize: [1024,1]

} 
const Memory_UnitMB= {
    value: '0 mb',
    unitAssociated:['mb','gb'],
    minVal: 0,
    maxVal: 10,
    standardStepSizes:[1,0.25],
    standardChunks:[128, 0.5],
    unitInUsePTR: 0,
    allowMultipleUnits: false,
    conversionToBiggerSize: [1024,1]

} 

describe('tests surrounding button functionality', () => {
    test('if state.value is set to \'0\' as default ', () => {
        const wrapper = shallow(<NumInputForm6 {...Memory_Unit}/>);
        expect(wrapper.state('value')).toBe('0');
    });
    test('if button.increment is clicked, state\'s numerical value is incremented', () => {
        const wrapper = shallow(<NumInputForm6 {...Memory_Unit}/>);
        expect(wrapper.state('value')).toBe('0');
        wrapper.find('#incrementButton').simulate('mouseDown');
        expect(wrapper.state('value')).toBe('1');
    })

    test('if state.value is set to \'0 mb\' as default ', () => {
        const wrapper = shallow(<NumInputForm6 {...Memory_UnitMB}/>);
        expect(wrapper.state('value')).toBe('0 mb');
    });
    test('if button.increment is clicked, state containing string\'s numerical value is incremented', () => {
        const wrapper = shallow(<NumInputForm6 {...Memory_UnitMB}/>);
        expect(wrapper.state('value')).toBe('0 mb');
        wrapper.find('#incrementButton').simulate('mouseDown');
        expect(wrapper.state('value')).toBe('1 mb');
    })
});
*/