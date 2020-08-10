import React from 'react';
import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import NumInputMerge1 from '../components/NumInputMerge1';

Enzyme.configure({ adapter: new Adapter() });

const Memory_Units = [{
    unit: 'MB',
    minVal: 0,
    maxVal: 10,
    standardStepSize: 1,
    standardChunk: 128,
    allowMultipleUnits: false,
    conversionToBiggerSize: 1024
  },
  {
    unit: 'GB',
    minVal: 0,
    maxVal: 10,
    standardStepSize: 0.25,
    standardChunk: 0.5,
    allowMultipleUnits: false,
    conversionToBiggerSize: 1024
  }]

describe('tests surrounding button functionality', () => {
    test('state.value set to \'0\' on default', () => {
        const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
        expect(wrapper.state('value')).toBe('0');
    });
    it(`should increment '0' to a numerical value`, () => {
        const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
        expect(wrapper.state('value')).toBe('0');
        wrapper.find('#incrementButton').simulate('mouseDown');
        expect(wrapper.state('value')).toBe('1');
    });
    it(`should increment '0' to a value with unit`, () => {
        const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
        expect(wrapper.state('value')).toBe('0');
        wrapper.find('#incrementButton').simulate('mouseDown');
        expect(wrapper.state('value')).toBe('1 MB');
    }); 
});
