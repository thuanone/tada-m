import React from "react";
import Enzyme, { shallow } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import NumInputMerge1 from "../components/NumInputMerge1";

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
      shortUnit: "Mi",
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
  ],
};

describe("tests surrounding overall button functionality", () => {
  test("state.value set to '0' on default", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    expect(wrapper.state("value")).toBe("0");
  });
  it(`should increment when invoking onClick('Increment'...)`, () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });

    expect(wrapper.state("value")).toBe("0");
    instance.onClick("Increment", wrapper.state("unitInUsePTR"), Memory_Units);
    expect(wrapper.state("value")).toBe("1 MiB");
  });
  it(`decrement into negatives when invoking onClick('decrement'...)`, () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });

    expect(wrapper.state("value")).toBe("0");
    instance.onClick("Increment", wrapper.state("unitInUsePTR"), Memory_Units);
    expect(wrapper.state("value")).toBe("-1 MiB");
  });
});
describe("getNumber()", () => {
  //receives a String and returns a Number (input) => number
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
        shortUnit: "Mi",
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
    ],
  };
  it("should √: invoked on NumbersOnlyString", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.getNumber("123");
    expect(returnValue).toBe(123);
  });
  it("should √: invoked on DecimalString", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.getNumber("10.5");
    expect(returnValue).toBe(10.5);
  });
  it("should X: NotAFeature: invoked on Number separated by whiteSpace", () => {
    //-> parse number correctly without whitespace
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.getNumber("1 000");
    expect(returnValue).toBe(1000);
  });
  it("should X: invoked on String, letters only", () => {
    //--> result in fail, getNumber should only called on valid string
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.getNumber("asbd");
    expect(returnValue).toBeNull();
  });
  it("should X: invoked on String special characters only", () => {
    //--> result in fail, getNumber should only called on valid string
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.getNumber("!.?Ä");
    expect(returnValue).toBeNull();
  });
  it(`should √: invoked on empty String`, () => {
    //-> parse number correctly without whitespace
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.getNumber("");
    expect(returnValue).toBe("-");
  });
  it("should √: invoked on String with Number", () => {
    // --> return only number
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.getNumber("10 mb");
    expect(returnValue).toBe(10);
  });
  it("should X: NotAFeature: invoked on String with Number separated by WhiteSpace", () => {
    //--> return adjoined number
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.getNumber("1 000 mb");
    expect(returnValue).toBe(1000);
  });
  it("should √: invoked on String with Decimal", () => {
    //--> return decimal number
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.getNumber("10.5 mb");
    expect(returnValue).toBe(10.5);
  });
  it("test: invoked on undefined", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.getNumber(undefined);
    expect(returnValue).toBe("-");
  });
  it("test: invoked on null", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.getNumber(null);
    expect(returnValue).toBe("-");
  });
});
describe("validate()", () => {
  //(userInput, config) => report {message: '...', isValid: oolean() }
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
        shortUnit: "Mi",
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
    ],
  };
  const Config = Memory_Units;
  it("should be √: any Numbers only", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const report = instance.validate("10", Config);
    expect(report.isValid).toBe(true);
  });
  it("should be √: Decimal Number", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const report = instance.validate("10.5", Config);
    expect(report.isValid).toBe(true);
  });
  it("should be false: random Letters only", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const report = instance.validate("asdjsakldjas", Config);
    expect(report.isValid).toBe(false);
  });
  it("should be false: Special Characters included", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const report = instance.validate("ÄÜ?", Config);
    expect(report.isValid).toBe(false);
  });
  it("should be false: Number in conjunction with letters", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const report = instance.validate("10 adsj", Config);
    expect(report.isValid).toBe(false);
  });
  it("should be false: Number Letters Numbers", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const report = instance.validate("10 daskj 10", Config);
    expect(report.isValid).toBe(false);
  });
  it("should be √: Unit correct", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const report = instance.validate("MiB", Config);
    expect(report.isValid).toBe(true);
  });
  it("should be √: Unit lowercase", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const report = instance.validate("mib", Config);
    expect(report.isValid).toBe(true);
  });
  it("should be √: Unit uppercase", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const report = instance.validate("MIB", Config);
    expect(report.isValid).toBe(true);
  });
  it("should be √: Number with Unit", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const report = instance.validate("10 MiB", Config);
    expect(report.isValid).toBe(true);
  });
  it("should be false: Number Unit Number", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const report = instance.validate("10 MiB 10", Config);
    expect(report.isValid).toBe(false);
  });
  it("should be false: Number Two Units", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const report = instance.validate("10 MiB GiB", Config);
    expect(report.isValid).toBe(false);
  });
  it("test: invoked on undefined", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.validate(undefined);
    expect(returnValue).toBe("-");
  });
  it("test: invoked on null", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.validate(null);
    expect(returnValue).toBe("-");
  });
});
describe("unitMatch()", () => {
  //(string ,config) =>
  // true -> index
  // fals -> 'notValid'
  //
  //string is parsed with regexString = /[a-z]+/gi afterwards joined
  //

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
        shortUnit: "Mi",
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
    ],
  };
  let Config = Memory_Units;
  it("should X: empty string", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.unitMatch("", Config).unitConfig;
    expect(returnValue).toBe("notValid");
  });
  it("should √: 1st unit only correct", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.unitMatch("MiB", Config.unitConfig);
    expect(returnValue).toEqual(expect.any(Number));
  });
  it("should √: 2nd unit only correct", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.unitMatch("GiB", Config.unitConfig);
    expect(returnValue).toEqual(expect.any(Number));
  });
  it("should √: 1st unit only short", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.unitMatch("Mi", Config.unitConfig);
    expect(returnValue).toEqual(expect.any(Number));
  });
  it("should √: 2nd unit only short", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.unitMatch("Gi", Config.unitConfig);
    expect(returnValue).toEqual(expect.any(Number));
  });
  it("should √: unit upppercase", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.unitMatch("GIB", Config.unitConfig);
    expect(returnValue).toEqual(expect.any(Number));
  });
  it("should √: unit lowecase", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.unitMatch("mib", Config.unitConfig);
    expect(returnValue).toEqual(expect.any(Number));
  });
  it("should √: unit short upppercase", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.unitMatch("GI", Config.unitConfig);
    expect(returnValue).toEqual(expect.any(Number));
  });
  it("should √: unit short lowecase", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.unitMatch("mi", Config.unitConfig);
    expect(returnValue).toEqual(expect.any(Number));
  });
  it("should X: unit letters", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.unitMatch("MiBhd", Config.unitConfig);
    expect(returnValue).toBe("notValid");
  });
  it("should X: letters unit", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.unitMatch("dasMiB", Config.unitConfig);
    expect(returnValue).toBe("notValid");
  });
  it("should X: special charcaters", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.unitMatch("Äß", Config.unitConfig);
    expect(returnValue).toBe("notValid");
  });
  it("should X: two units", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.unitMatch("MiBGiB", Config.unitConfig);
    expect(returnValue).toBe("notValid");
  });
  it("test: invoked on undefined", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.unitMatch(undefined, Config.unitConfig);
    expect(returnValue).toBe("-");
  });
  it("test: invoked on null", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    const returnValue = instance.unitMatch(null, Config.unitConfig);
    expect(returnValue).toBe("-");
  });
});
describe("increment()/decrement()", () => {
  //(number, unitInUsePTR, Config) => number
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
        shortUnit: "Mi",
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
    ],
  };
  let Config = Memory_Units;
  let unitOne, unitTwo;
  [unitOne, unitTwo] = [0, 1];
  //tests for correct stepsize is Missing
  //expect stepSize === Difference(number, newNumber)

  it("increments once normally", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    let number = 0;
    const returnValue = instance.increment(number, unitOne, Config);
    expect(returnValue).toBeGreaterThan(number);
  });
  it("increments twice normally", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    let number = 0;
    const newNumber = instance.increment(number, unitOne, Config);
    const returnValue = instance.increment(newNumber, unitOne, Config);
    expect(newNumber).toBeGreaterThan(number);
    expect(returnValue).toBeGreaterThan(newNumber);
  });
  it("increment stops at maxValue threshold", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    Config.general.maxVal = 1023;
    let maxVal = Config.general.maxVal;
    let minVal = Config.general.minVal;
    let number = minVal;
    let newNumber;
    let i;
    for (i = 0; i < maxVal + 10; i++) {
      newNumber = instance.increment(number, unitOne, Config);
      number = newNumber;
    }
    const returnValue = newNumber;
    expect(returnValue).toBe(maxVal);
  });
  it("decrements once normally", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });
    let number = 2;
    const returnValue = instance.decrement(number, unitOne, Config);
    expect(returnValue).toBeLessThan(number);
  });
  it("decrements twice normally", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });

    let number = 2;
    const newNumber = instance.decrement(number, unitOne, Config);
    const returnValue = instance.decrement(newNumber, unitOne, Config);
    expect(newNumber).toBeLessThan(number);
    expect(returnValue).toBeLessThan(newNumber);
  });
  it("decrement stops at minValue threshold", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });

    Config.general.maxVal = 1023;
    let maxVal = Config.general.maxVal;
    let minVal = Config.general.minVal;
    let number = maxVal;
    let newNumber;
    let i;
    for (i = 0; i < maxVal + 10; i++) {
      newNumber = instance.decrement(number, unitOne, Config);
      number = newNumber;
    }
    const returnValue = newNumber;
    expect(returnValue).toBe(minVal);
  });
  it(`'-' incremented equals 1`, () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });

    let number = "-";
    const returnValue = instance.increment(number, unitOne, Config);
    expect(returnValue).toBe(1);
  });
  it(`'-'decremented equals 0`, () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });

    let number = "-";
    const returnValue = instance.increment(number, unitOne, Config);
    expect(returnValue).toBe(0);
  });
});
describe("convert()", () => {
  //receives a number, an Array Index for the unit used and and Array containing unit Objects
  //returns an Object containg number, unit used and and Array Index
  // (number,unitInUsePTR,unitRX,Config) => let convertedNumber = {number : number, unit : unitRX, unitPTR: unitInUsePTR,}
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
  let Config = Memory_Units;
  let newNumber, unitInUsePTR, unitRX;
  it("converts 1st unit to 2nd unit", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });

    [newNumber, unitInUsePTR, unitRX] = [1024, 0, ["MiB"]];
    //
    const returnConverted = instance.convert(
      newNumber,
      unitInUsePTR,
      unitRX,
      Config
    );
    expect(returnConverted).toEqual({
      number: 1,
      unit: "GiB",
      unitPTR: 1,
    });
  });
  it("converts 2nd unit to 3rd unit", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });

    [newNumber, unitInUsePTR, unitRX] = [1025, 1, ["GiB"]];
    //
    const returnConverted = instance.convert(
      newNumber,
      unitInUsePTR,
      unitRX,
      Config
    );
    expect(returnConverted).toEqual({
      number: 1,
      unit: "TiB",
      unitPTR: 2,
    });
  });
  it("converts 3rd unit to 2nd unit", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });

    [newNumber, unitInUsePTR, unitRX] = [0.75, 2, ["TiB"]];
    //
    const returnConverted = instance.convert(
      newNumber,
      unitInUsePTR,
      unitRX,
      Config
    );
    expect(returnConverted).toEqual({
      number: 1023.75,
      unit: "GiB",
      unitPTR: 1,
    });
  });
  it("converts 2nd unit to 1st unit", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });

    [newNumber, unitInUsePTR, unitRX] = [0.75, 1, ["GiB"]];
    //
    const returnConverted = instance.convert(
      newNumber,
      unitInUsePTR,
      unitRX,
      Config
    );
    expect(returnConverted).toEqual({
      number: 1023,
      unit: "MiB",
      unitPTR: 0,
    });
  });
  it("doesnt convert above biggest unit", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });

    [newNumber, unitInUsePTR, unitRX] = [10225, 2, ["TiB"]];
    //
    const returnConverted = instance.convert(
      newNumber,
      unitInUsePTR,
      unitRX,
      Config
    );
    expect(returnConverted).toEqual({
      number: 10225,
      unit: "TiB",
      unitPTR: 2,
    });
  });
  it("shouldnt occur: doesnt convert below smallest unit -> reliance on (decimals invalid with smallest units)", () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });

    [newNumber, unitInUsePTR, unitRX] = [0.9, 0, ["MiB"]];
    //
    const returnConverted = instance.convert(
      newNumber,
      unitInUsePTR,
      unitRX,
      Config
    );
    expect(returnConverted).toEqual({
      number: 0.9,
      unit: "MiB",
      unitPTR: 0,
    });
  });
  it(`shouldnt occur: convert '-', MiB set -> (convert is called by onClick, '-' would be in/de-cremented in beforehand)`, () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });

    [newNumber, unitInUsePTR, unitRX] = ["-", 0, ["MiB"]];
    //
    const returnConverted = instance.convert(
      newNumber,
      unitInUsePTR,
      unitRX,
      Config
    );
    expect(returnConverted).toEqual({
      number: "-",
      unit: "MiB",
      unitPTR: 0,
    });
  });
  it(`shouldnt occur: convert '-', GiB set -> (convert is called by onClick, '-' would be in/de-cremented in beforehand)`, () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });

    [newNumber, unitInUsePTR, unitRX] = ["-", 1, ["GiB"]];
    //
    const returnConverted = instance.convert(
      newNumber,
      unitInUsePTR,
      unitRX,
      Config
    );
    expect(returnConverted).toEqual({
      number: "-",
      unit: "GiB",
      unitPTR: 1,
    });
  });
  it(`shouldnt occur: convert '-', TiB set -> (convert is called by onClick, '-' would be in/de-cremented in beforehand)`, () => {
    const wrapper = shallow(<NumInputMerge1 {...Memory_Units} />);
    const instance = wrapper.instance({ ...Memory_Units });

    [newNumber, unitInUsePTR, unitRX] = ["-", 2, ["TiB"]];
    //
    const returnConverted = instance.convert(
      newNumber,
      unitInUsePTR,
      unitRX,
      Config
    );
    expect(returnConverted).toEqual({
      number: "-",
      unit: "TiB",
      unitPTR: 2,
    });
  });
});

/*
decribe("integration testin increment/decremnt and convert", () ={

})



describe('tests surrounding general textInput functionality', () => {

});


*/
