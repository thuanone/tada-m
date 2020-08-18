import React from "react";
import Enzyme, { shallow } from "enzyme";
import { mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import QInput from "../components/QInput";
import QInputPage from "../content/QInputPage";
import { vCPU as vCPUFromUnits } from "../components/QInput/units";
import { Memory as MemoryFromUnits } from "../components/QInput/units";
import { noUnit as noUnitFromUnits } from "../components/QInput/units";

Enzyme.configure({ adapter: new Adapter() });

const Memory_Units = {
  general: {
    // base config
    convertUnit: 1024,
    minVal: 0,
    // maxVal : ?,
  },
  unitConfig: [
    {
      unit: "MiB",
      shortUnit: "MI",
      standardStepSize: 1,
      standardChunk: 128,
      allowMultipleUnits: false,
    },
    {
      unit: "GiB",
      shortUnit: "Gi",
      standardStepSize: 0.25,
      standardChunk: 0.5,
      allowMultipleUnits: false,
    },
    {
      unit: "TiB",
      shortUnit: "Ti",
      standardStepSize: 0.1,
      standardChunk: 0.5,
      allowMultipleUnits: false,
    },
  ],
};
const Memory = [
  /*
  {
    unit: "Byte",
    shortUnit: "byte",
    standardStepSize: 1,
    standardChunk: 128,
    convertUpAt: 1024,
  },
  {
    unit: "KiB",
    shortUnit: "Ki",
    standardStepSize: 1,
    standardChunk: 128,
    convertUpAt: 1024,
  },
  */
  {
    unit: "MiB",
    shortUnit: "Mi",
    standardStepSize: 1,
    standardChunk: 128,
    convertUpAt: 1024,
  },
  {
    unit: "GiB",
    shortUnit: "Gi",
    standardStepSize: 0.25,
    standardChunk: 0.5,
    convertUpAt: 1024,
  },
  {
    unit: "TiB",
    shortUnit: "Ti",
    standardStepSize: 0.1,
    standardChunk: 0.5,
    convertUpAt: 1024,
  },
];
describe("functions as is", () => {
  describe("getNumber()", () => {
    //receives a String and returns a Number (input) => number
    it("should √: invoked on NumbersOnlyString", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.getNumber("123");
      expect(returnValue).toBe(123);
    });
    it("should √: invoked on DecimalString", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.getNumber("10.5");
      expect(returnValue).toBe(10.5);
    });
    it("should X: NotAFeature: invoked on Number separated by whiteSpace", () => {
      //-> parse number correctly without whitespace
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.getNumber("1 000");
      expect(returnValue).toBe(1000);
    });
    it("should X: invoked on String, letters only", () => {
      //--> result in fail, getNumber should only called on valid string
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.getNumber("asbd");
      expect(returnValue).toBeNull();
    });
    it("should X: invoked on String special characters only", () => {
      //--> result in fail, getNumber should only called on valid string
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.getNumber("!.?Ä");
      expect(returnValue).toBeNull();
    });
    it(`should √: invoked on empty String`, () => {
      //-> parse number correctly without whitespace
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.getNumber("");
      expect(returnValue).toBe(0);
    });
    it("should √: invoked on String with Number", () => {
      // --> return only number
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.getNumber("10 mb");
      expect(returnValue).toBe(10);
    });
    it("should X: NotAFeature: invoked on String with Number separated by WhiteSpace", () => {
      //--> return adjoined number
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.getNumber("1 000 mb");
      expect(returnValue).toBe(1000);
    });
    it("should √: invoked on String with Decimal", () => {
      //--> return decimal number
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.getNumber("10.5 mb");
      expect(returnValue).toBe(10.5);
    });
    it("test: invoked on undefined", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.getNumber(undefined);
      expect(returnValue).toBe("-");
    });
    it("test: invoked on null", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.getNumber(null);
      expect(returnValue).toBe("-");
    });
    it(`test: invoked on '-'`, () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.getNumber("-");
      expect(returnValue).toBe("-");
    });
    it(`test: invoked on Number Number`, () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.getNumber(100);
      expect(returnValue).toBe(100);
    });
  });
  describe("validate()", () => {
    //(userInput, config) => report {message: '...', isValid: oolean() }
    const Config = Memory_Units;
    const units = Memory;
    it("isValid: any Numbers only", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const report = instance.validate("10", units);
      expect(report.isValid).toBe(true);
    });
    it("isValid: Decimal Number", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const report = instance.validate("10.5", units);
      expect(report.isValid).toBe(true);
    });
    it("is inValid: random Letters only", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const report = instance.validate("asdjsakldjas", units);
      expect(report.isValid).toBe(false);
    });
    it("is inValid: Special Characters included", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const report = instance.validate("ÄÜ?", units);
      expect(report.isValid).toBe(false);
    });
    it("is inValid: Number in conjunction with random letters", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const report = instance.validate("10 adsj", units);
      expect(report.isValid).toBe(false);
    });
    it("is inValid: Number Letters Numbers", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const report = instance.validate("10 daskj 10", units);
      expect(report.isValid).toBe(false);
    });
    it("is inValid: only Unit correct", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const report = instance.validate("MiB", units);
      expect(report.isValid).toBe(false);
    });
    it("is inValid: only Unit lowercase", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const report = instance.validate("mib", units);
      expect(report.isValid).toBe(false);
    });
    it("is inValid: only Unit uppercase", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const report = instance.validate("MIB", units);
      expect(report.isValid).toBe(false);
    });
    it("isValid: Number with Unit", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const report = instance.validate("10 MiB", units);
      expect(report.isValid).toBe(true);
    });
    it("isValid: Number with Unit shorthand", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const report = instance.validate("10 Mi", units);
      expect(report.isValid).toBe(true);
    });
    it("isValid: Number with Unit shorthand lowercase", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const report = instance.validate("10 mi", units);
      expect(report.isValid).toBe(true);
    });
    it("isValid: Number with Unit shorthand uppercase", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const report = instance.validate("10 MI", units);
      expect(report.isValid).toBe(true);
    });
    it("isValid: Number Unit lowercase", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const report = instance.validate("10 mib", units);
      expect(report.isValid).toBe(true);
    });
    it("isValid: Number Unit uppercase", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const report = instance.validate("10 MIB", units);
      expect(report.isValid).toBe(true);
    });
    it("is inValid: Number Unit Number", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const report = instance.validate("10 MiB 10", units);
      expect(report.isValid).toBe(false);
    });
    it("is inValid: Number Two Units", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const report = instance.validate("10 MiB GiB", units);
      expect(report.isValid).toBe(false);
    });
    it("test: invoked on undefined", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.validate(undefined, units);
      expect(returnValue.isValid).toBe(false);
    });
    it("test: invoked on null", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.validate(null, units);
      expect(returnValue.isValid).toBe(false);
    });
  });
  describe("unitMatch()", () => {
    //(string ,config) =>
    // true -> index
    // fals -> 'notValid'
    //
    //string is parsed with regexString = /[a-z]+/gi afterwards joined
    //
    let Config = Memory_Units;
    it("Number: 1st unit only correct", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.unitMatch("MiB", Config.unitConfig);
      expect(returnValue).toEqual(expect.any(Number));
    });
    it("Number √: 2nd unit only correct", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.unitMatch("GiB", Config.unitConfig);
      expect(returnValue).toEqual(expect.any(Number));
    });
    it("Number √: 1st unit only short", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.unitMatch("Mi", Config.unitConfig);
      expect(returnValue).toEqual(expect.any(Number));
    });
    it("Number √: 2nd unit only short", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.unitMatch("Gi", Config.unitConfig);
      expect(returnValue).toEqual(expect.any(Number));
    });
    it("Number √: unit upppercase", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.unitMatch("GIB", Config.unitConfig);
      expect(returnValue).toEqual(expect.any(Number));
    });
    it("Number √: unit lowecase", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.unitMatch("mib", Config.unitConfig);
      expect(returnValue).toEqual(expect.any(Number));
    });
    it("Number √: unit short upppercase", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.unitMatch("GI", Config.unitConfig);
      expect(returnValue).toEqual(expect.any(Number));
    });
    it("Number √: unit short lowecase", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.unitMatch("mi", Config.unitConfig);
      expect(returnValue).toEqual(expect.any(Number));
    });
    it("notValid √: unit letters", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.unitMatch("MiBhd", Config.unitConfig);
      expect(returnValue).toBe("notValid");
    });
    it("notValid √: letters unit", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.unitMatch("dasMiB", Config.unitConfig);
      expect(returnValue).toBe("notValid");
    });
    it("notValid √: special charcaters", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.unitMatch("Äß", Config.unitConfig);
      expect(returnValue).toBe("notValid");
    });
    it("notValid √: two units", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.unitMatch("MiBGiB", Config.unitConfig);
      expect(returnValue).toBe("notValid");
    });
    it("notValid √: invoked on undefined", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.unitMatch(undefined, Config.unitConfig);
      expect(returnValue).toBe("notValid");
    });
    it("notValid √: invoked on null", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.unitMatch(null, Config.unitConfig);
      expect(returnValue).toBe("notValid");
    });
    it("notValid √: empty string", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      const returnValue = instance.unitMatch("", Config.unitConfig);
      expect(returnValue).toBe("notValid");
    });
  });
  describe("increment()/decrement()", () => {
    //(number, unitInUsePTR, Config) => number
    let Config = Memory_Units;
    let units = Memory;
    let unitOne, unitTwo;
    [unitOne, unitTwo] = [0, 1];
    //tests for correct stepsize is Missing
    //expect stepSize === Difference(number, newNumber)

    it("increments once normally", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      let number = 0;
      const returnValue = instance.increment(
        number,
        unitOne,
        units,
        Config.general.maxVal
      );
      expect(returnValue.number).toBeGreaterThan(number);
    });
    it("increments twice normally", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      let number = 0;
      const newNumber = instance.increment(
        number,
        unitOne,
        units,
        Config.general.maxVal
      );
      const returnValue = instance.increment(
        newNumber.number,
        unitOne,
        units,
        Config.general.maxVal
      );
      expect(newNumber.number).toBeGreaterThan(number);
      expect(returnValue.number).toBeGreaterThan(newNumber.number);
    });
    it("increment stops at maxValue threshold", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      Config.general.maxVal = 1023;
      let maxVal = Config.general.maxVal;
      let minVal = Config.general.minVal;
      let number = minVal;
      let newNumber;
      let i;
      for (i = 0; i < maxVal + 10; i++) {
        newNumber = instance.increment(
          number,
          unitOne,
          units,
          Config.general.maxVal
        );
        number = newNumber.number;
      }
      const returnValue = newNumber;
      expect(returnValue.number).toBe(maxVal);
    });
    it("decrements once normally", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();
      let number = 2;
      const returnValue = instance.decrement(
        number,
        unitOne,
        units,
        Config.general.minVal
      );
      expect(returnValue.number).toBeLessThan(number);
    });
    it("decrements twice normally", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();

      let number = 2;
      const newNumber = instance.decrement(
        number,
        unitOne,
        units,
        Config.general.minVal
      );
      const returnValue = instance.decrement(
        newNumber.number,
        unitOne,
        units,
        Config.general.minVal
      );
      expect(newNumber.number).toBeLessThan(number);
      expect(returnValue.number).toBeLessThan(newNumber.number);
    });
    it("decrement stops at minValue threshold", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();

      Config.general.maxVal = 1023;
      let maxVal = Config.general.maxVal;
      let minVal = Config.general.minVal;
      let number = maxVal;
      let newNumber;
      let i;
      for (i = 0; i < maxVal + 10; i++) {
        newNumber = instance.decrement(
          number,
          unitOne,
          units,
          Config.general.minVal
        );
        number = newNumber.number;
      }
      const returnValue = newNumber;
      expect(returnValue.number).toBe(minVal);
    });
    it(`'-' incremented equals 1`, () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();

      let number = "-";
      const returnValue = instance.increment(
        number,
        unitOne,
        units,
        Config.general.maxVal
      );
      expect(returnValue.number).toBe(1);
    });
    it(`'-'decremented equals 0`, () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();

      let number = "-";
      const returnValue = instance.decrement(
        number,
        unitOne,
        units,
        Config.general.minVal
      );
      expect(returnValue.number).toBe(0);
    });
  });
  describe("convert()", () => {
    //receives a number, an Array Index for the unit used and and Array containing unit Objects
    //returns an Object containg number, unit used and and Array Index
    // (number,unitInUsePTR,unitRX,Config) => let convertedNumber = {number : number, unit : unitRX, unitPTR: unitInUsePTR,}
    let unitConfig = Memory;
    let newNumber, unitInUsePTR, unitRX;
    it("converts 1st unit to 2nd unit", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();

      [newNumber, unitInUsePTR, unitRX] = [1024, 0, "MiB"];
      //
      const returnConverted = instance.convert(
        newNumber,
        unitInUsePTR,
        unitRX,
        unitConfig
      );
      expect(returnConverted).toEqual({
        number: 1,
        unit: "GiB",
        unitPTR: 1,
      });
    });
    it("converts 2nd unit to 3rd unit", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();

      [newNumber, unitInUsePTR, unitRX] = [1025, 1, "GiB"];
      //
      const returnConverted = instance.convert(
        newNumber,
        unitInUsePTR,
        unitRX,
        unitConfig
      );
      expect(returnConverted).toEqual({
        number: 1,
        unit: "TiB",
        unitPTR: 2,
      });
    });
    it("converts 3rd unit to 2nd unit", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();

      [newNumber, unitInUsePTR, unitRX] = [0.75, 2, "TiB"];
      //
      const returnConverted = instance.convert(
        newNumber,
        unitInUsePTR,
        unitRX,
        unitConfig
      );
      expect(returnConverted).toEqual({
        number: 1023.8,
        unit: "GiB",
        unitPTR: 1,
      });
    });
    it("converts 2nd unit to 1st unit", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();

      [newNumber, unitInUsePTR, unitRX] = [0.75, 1, "GiB"];
      //
      const returnConverted = instance.convert(
        newNumber,
        unitInUsePTR,
        unitRX,
        unitConfig
      );
      expect(returnConverted).toEqual({
        number: 1023,
        unit: "MiB",
        unitPTR: 0,
      });
    });
    it("doesnt convert above biggest unit", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();

      [newNumber, unitInUsePTR, unitRX] = [10225, 2, "TiB"];
      //
      const returnConverted = instance.convert(
        newNumber,
        unitInUsePTR,
        unitRX,
        unitConfig
      );
      expect(returnConverted).toEqual({
        number: 10225,
        unit: "TiB",
        unitPTR: 2,
      });
    });
    it("shouldnt occur: doesnt convert below smallest unit -> reliance on (decimals invalid with smallest units)", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();

      [newNumber, unitInUsePTR, unitRX] = [0.9, 0, "MiB"];
      //
      const returnConverted = instance.convert(
        newNumber,
        unitInUsePTR,
        unitRX,
        unitConfig
      );
      expect(returnConverted).toEqual({
        number: 0.9,
        unit: "MiB",
        unitPTR: 0,
      });
    });
    it(`shouldnt occur: convert '-', MiB set -> (convert is called by onClick, '-' would be in/de-cremented in beforehand)`, () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();

      [newNumber, unitInUsePTR, unitRX] = ["-", 0, "MiB"];
      //
      const returnConverted = instance.convert(
        newNumber,
        unitInUsePTR,
        unitRX,
        unitConfig
      );
      expect(returnConverted).toEqual({
        number: "-",
        unit: "MiB",
        unitPTR: 0,
      });
    });
    it(`shouldnt occur: convert '-', GiB set -> (convert is called by onClick, '-' would be in/de-cremented in beforehand)`, () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();

      [newNumber, unitInUsePTR, unitRX] = ["-", 1, "GiB"];
      //
      const returnConverted = instance.convert(
        newNumber,
        unitInUsePTR,
        unitRX,
        unitConfig
      );
      expect(returnConverted).toEqual({
        number: "-",
        unit: "GiB",
        unitPTR: 1,
      });
    });
    it(`shouldnt occur: convert '-', TiB set -> (convert is called by onClick, '-' would be in/de-cremented in beforehand)`, () => {
      const wrapper = shallow(<QInput unitConfig={Memory} minVal="0" />);
      const instance = wrapper.instance();

      [newNumber, unitInUsePTR, unitRX] = ["-", 2, "TiB"];
      //
      const returnConverted = instance.convert(
        newNumber,
        unitInUsePTR,
        unitRX,
        unitConfig
      );
      expect(returnConverted).toEqual({
        number: "-",
        unit: "TiB",
        unitPTR: 2,
      });
    });
  });
});

describe("onClick Functionality", () => {
  describe("Tag as is", () => {
    it("", () => {
      const wrapper = shallow(<QInput />);
      const instance = wrapper.instance();
    });
    it("default props correct", () => {
      //cant test default props because of shallow https://github.com/enzymejs/enzyme/issues/2115
      const wrapper = shallow(<QInput />);
      const instance = wrapper.instance();
      console.log(
        "cant test default props because of shallow https://github.com/enzymejs/enzyme/issues/2115"
      );
      expect(wrapper.state().value).toBe("");
      expect(wrapper.props().unitConfig).toEqual(Memory);
    });
    it("default props correct mount", () => {
      //cant test default props because of shallow https://github.com/enzymejs/enzyme/issues/2115
      const wrapper = mount(<QInput />);
      const props = wrapper.props();
      expect(props.minVal).toBe(0);
      expect(props.unitConfig).toEqual(Memory);
    });
    it("increments once from starting value", () => {
      const wrapper = shallow(<QInput />);
      const instance = wrapper.instance();
      let unitPTR = wrapper.state().unitInUsePTR;
      instance.onClick("Increment", unitPTR);
      expect(wrapper.state().value).toBe("1 MiB");
    });
    it("decrements once from starting value", () => {
      const wrapper = shallow(<QInput />);
      const instance = wrapper.instance();
      let unitPTR = wrapper.state().unitInUsePTR;
      instance.onClick("Decrement", unitPTR);
      expect(wrapper.state().value).toBe("0 MiB");
    });
    it("increments number numbers", () => {
      const wrapper = shallow(<QInput />);
      const instance = wrapper.instance();
      let unitPTR = wrapper.state().unitInUsePTR;

      wrapper.setState({ value: 1 });
      instance.onClick("Increment", unitPTR);
      expect(wrapper.state().value).toBe("2 MiB");
    });
    it("increments string numbers", () => {
      const wrapper = shallow(<QInput />);
      const instance = wrapper.instance();
      let unitPTR = wrapper.state().unitInUsePTR;

      wrapper.setState({ value: "1" });
      console.log(wrapper.state().value);
      instance.onClick("Increment", unitPTR);
      expect(wrapper.state().value).toBe("2 MiB");
    });
    it("increments, converts and sets state correctly 1->2", () => {
      const wrapper = shallow(<QInput />);
      const instance = wrapper.instance();
      let unitPTR = wrapper.state().unitInUsePTR;
      wrapper.setState({ value: "1023" });
      instance.onClick("Increment", unitPTR);
      expect(wrapper.state().value).toBe("1 GiB");
      expect(wrapper.state().unitInUsePTR).toBe(1);
      expect(wrapper.state().message).toBe("");
      expect(wrapper.state().isValid).toBe(true);
    });
    it("decrements, converts and sets state correctly 2->1", () => {
      const wrapper = shallow(<QInput />);
      const instance = wrapper.instance();
      wrapper.setState({ value: "1", unitInUsePTR: 1 });
      let unitPTR = wrapper.state().unitInUsePTR;
      instance.onClick("Decrement", unitPTR);
      expect(wrapper.state().value).toBe("1023 MiB");
      expect(wrapper.state().unitInUsePTR).toBe(0);
      expect(wrapper.state().message).toBe("");
      expect(wrapper.state().isValid).toBe(true);
    });
  });
  describe("Tag with Memory Input", () => {
    const Memory = MemoryFromUnits;
    it("", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} />);
      const instance = wrapper.instance();
    });
    it("default props correct", () => {
      //cant test default props because of shallow https://github.com/enzymejs/enzyme/issues/2115
      const wrapper = shallow(<QInput unitConfig={Memory} />);
      const instance = wrapper.instance();
      console.log(
        "cant test default props because of shallow https://github.com/enzymejs/enzyme/issues/2115"
      );
      expect(wrapper.state().value).toBe("");
      expect(wrapper.props().unitConfig).toEqual(Memory);
    });
    it("default props correct mount", () => {
      //cant test default props because of shallow https://github.com/enzymejs/enzyme/issues/2115
      const wrapper = mount(<QInput unitConfig={Memory} />);
      const props = wrapper.props();
      expect(props.minVal).toBe(0);
      expect(props.unitConfig).toEqual(Memory);
    });
    it("increments once from starting value", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} />);
      const instance = wrapper.instance();
      let unitPTR = wrapper.state().unitInUsePTR;
      instance.onClick("Increment", unitPTR);
      expect(wrapper.state().value).toBe("1 MiB");
    });
    it("decrements once from starting value", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} />);
      const instance = wrapper.instance();
      let unitPTR = wrapper.state().unitInUsePTR;
      instance.onClick("Decrement", unitPTR);
      expect(wrapper.state().value).toBe("0 MiB");
    });
    it("increments number numbers", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} />);
      const instance = wrapper.instance();
      let unitPTR = wrapper.state().unitInUsePTR;

      wrapper.setState({ value: 1 });
      instance.onClick("Increment", unitPTR);
      expect(wrapper.state().value).toBe("2 MiB");
    });
    it("increments string numbers", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} />);
      const instance = wrapper.instance();
      let unitPTR = wrapper.state().unitInUsePTR;

      wrapper.setState({ value: "1" });
      console.log(wrapper.state().value);
      instance.onClick("Increment", unitPTR);
      expect(wrapper.state().value).toBe("2 MiB");
    });
    it("increments, converts and sets state correctly 1->2", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} />);
      const instance = wrapper.instance();
      let unitPTR = wrapper.state().unitInUsePTR;
      wrapper.setState({ value: "1023" });
      instance.onClick("Increment", unitPTR);
      expect(wrapper.state().value).toBe("1 GiB");
      expect(wrapper.state().unitInUsePTR).toBe(1);
      expect(wrapper.state().message).toBe("");
      expect(wrapper.state().isValid).toBe(true);
    });
    it("decrements, converts and sets state correctly 2->1", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} />);
      const instance = wrapper.instance();
      wrapper.setState({ value: "1", unitInUsePTR: 1 });
      let unitPTR = wrapper.state().unitInUsePTR;
      instance.onClick("Decrement", unitPTR);
      expect(wrapper.state().value).toBe("1023 MiB");
      expect(wrapper.state().unitInUsePTR).toBe(0);
      expect(wrapper.state().message).toBe("");
      expect(wrapper.state().isValid).toBe(true);
    });
  });
  describe("tag with vCPU", () => {
    const vCPU = vCPUFromUnits;
    it("", () => {
      const wrapper = shallow(<QInput unitConfig={vCPU} />);
      const instance = wrapper.instance();
    });
    it("default props correct", () => {
      //cant test default props because of shallow https://github.com/enzymejs/enzyme/issues/2115
      const wrapper = shallow(<QInput unitConfig={vCPU} />);
      const instance = wrapper.instance();
      console.log(
        "cant test default props because of shallow https://github.com/enzymejs/enzyme/issues/2115"
      );
      expect(wrapper.state().value).toBe("");
      expect(wrapper.props().unitConfig).toEqual(vCPU);
    });
    it("default props correct mount", () => {
      //cant test default props because of shallow https://github.com/enzymejs/enzyme/issues/2115
      const wrapper = mount(<QInput unitConfig={vCPU} />);
      const props = wrapper.props();
      expect(props.minVal).toBe(0);
      expect(props.unitConfig).toEqual(vCPU);
    });
    it("increments once from starting value", () => {
      const wrapper = shallow(<QInput unitConfig={vCPU} />);
      const instance = wrapper.instance();
      let unitPTR = wrapper.state().unitInUsePTR;
      instance.onClick("Increment", unitPTR);
      expect(wrapper.state().value).toBe("100 m");
    });
    it("decrements once from starting value", () => {
      const wrapper = shallow(<QInput unitConfig={vCPU} />);
      const instance = wrapper.instance();
      let unitPTR = wrapper.state().unitInUsePTR;
      instance.onClick("Decrement", unitPTR);
      expect(wrapper.state().value).toBe("0 m");
    });
    it("increments number numbers", () => {
      const wrapper = shallow(<QInput unitConfig={vCPU} />);
      const instance = wrapper.instance();
      let unitPTR = wrapper.state().unitInUsePTR;

      wrapper.setState({ value: 100 });
      instance.onClick("Increment", unitPTR);
      expect(wrapper.state().value).toBe("200 m");
    });
    it("increments string numbers", () => {
      const wrapper = shallow(<QInput unitConfig={vCPU} />);
      const instance = wrapper.instance();
      let unitPTR = wrapper.state().unitInUsePTR;

      wrapper.setState({ value: "100" });
      console.log(wrapper.state().value);
      instance.onClick("Increment", unitPTR);
      expect(wrapper.state().value).toBe("200 m");
    });
    it("increments, converts and sets state correctly 1->2", () => {
      const wrapper = shallow(<QInput unitConfig={vCPU} />);
      const instance = wrapper.instance();
      let unitPTR = wrapper.state().unitInUsePTR;
      wrapper.setState({ value: "900" });
      instance.onClick("Increment", unitPTR);
      expect(wrapper.state().value).toBe("1 vCPU");
      expect(wrapper.state().unitInUsePTR).toBe(1);
      expect(wrapper.state().message).toBe("");
      expect(wrapper.state().isValid).toBe(true);
    });
    it("decrements, converts and sets state correctly 2->1", () => {
      const wrapper = shallow(<QInput unitConfig={vCPU} />);
      const instance = wrapper.instance();
      wrapper.setState({ value: "1", unitInUsePTR: 1 });
      let unitPTR = wrapper.state().unitInUsePTR;
      instance.onClick("Decrement", unitPTR);
      expect(wrapper.state().value).toBe("900 m");
      expect(wrapper.state().unitInUsePTR).toBe(0);
      expect(wrapper.state().message).toBe("");
      expect(wrapper.state().isValid).toBe(true);
    });
  });
  describe("tag with empty unit", () => {
    const noUnit = noUnitFromUnits;
    it("", () => {
      const wrapper = shallow(<QInput unitConfig={noUnit} />);
      const instance = wrapper.instance();
    });
    it("increments to Number(1)", () => {
      const wrapper = shallow(<QInput unitConfig={noUnit} />);
      const instance = wrapper.instance();
      instance.onClick("Increment", 0);
      expect(wrapper.state().value).toBe(1);;
    });
  });
});
describe("onChange Functionality", () => {
  describe("Tag as is", () => {
    it("", () => {
      const wrapper = shallow(<QInput />);
      const instance = wrapper.instance();
    });
  });
  describe("Tag with Memory Input", () => {
    const Memory = [
      {
        unit: "Byte",
        shortUnit: "byte",
        standardStepSize: 1,
        standardChunk: 128,
        convertUpAt: 1024,
      },
      {
        unit: "KiB",
        shortUnit: "Ki",
        standardStepSize: 1,
        standardChunk: 128,
        convertUpAt: 1024,
      },
      {
        unit: "MiB",
        shortUnit: "Mi",
        standardStepSize: 1,
        standardChunk: 128,
        convertUpAt: 1024,
      },
      {
        unit: "GiB",
        shortUnit: "Gi",
        standardStepSize: 0.25,
        standardChunk: 0.5,
        convertUpAt: 1024,
      },
      {
        unit: "TiB",
        shortUnit: "Ti",
        standardStepSize: 0.1,
        standardChunk: 0.5,
        convertUpAt: 1024,
      },
    ];
    it("", () => {
      const wrapper = shallow(<QInput unitConfig={Memory} />);
      const instance = wrapper.instance();
    });
  });
  describe("tag with vCPU", () => {
    const vCPU = [
      {
        unit: "m",
        shortUnit: "m",
        stepSize: 10,
        standardChunk: 100,
        convertUpAt: 1000,
      },
      {
        unit: "vCPU",
        shortUnit: "CPU",
        stepSize: 0.1,
        standardChunk: 1,
        convertUpAt: Infinity,
      },
    ];
    it("", () => {
      const wrapper = shallow(<QInput unitConfig={vCPU} />);
      const instance = wrapper.instance();
    });
  });
  describe("tag with empty unit", () => {
    const noUnit = [
      {
        unit: "",
        shortUnit: "",
        standardStepSize: 1,
        standardChunk: 10,
        allowMultipleUnits: false,
      },
    ];
    it("", () => {
      const wrapper = shallow(<QInput unitConfig={noUnit} />);
      const instance = wrapper.instance();
    });
  });
});
describe("Parent Component Integration", () => {
  it("", () => {
    const parentWrapper = shallow(<QInputPage />);
    const parentInstance = parentWrapper.instance();
    const componentWrapper = shallow(<QInput />);
    const componentInstance = componentWrapper.instance();
  });
});
