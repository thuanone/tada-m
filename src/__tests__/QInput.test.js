import React from "react";
import Enzyme, { shallow, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import QInput from "../components/QInput";
import QInputPage from "../content/QInputPage";
import { vCPU as vCPUFromUnits } from "../components/QInput/units";
import { Memory as MemoryFromUnits } from "../components/QInput/units";
import { noUnit as noUnitFromUnits } from "../components/QInput/units";

Enzyme.configure({ adapter: new Adapter() });

describe("functions as is", () => {
  let wrapper, instance, component;
  beforeEach(() => {
    wrapper = shallow(<QInput />);
    instance = wrapper.instance();
  });
  describe("getNumber(input)", () => {
    let wrapper, instance, component;
    beforeEach(() => {
      wrapper = shallow(<QInput />);
      instance = wrapper.instance();
    });
    describe("numbers", () => {
      it(`"1234" => 1234`, () => {
        expect(instance.getNumber("1234")).toBe(1234);
      });
      it(`1234 => 1234`, () => {
        expect(instance.getNumber(1234)).toBe(1234);
      });
      it(`"123 4" => 1234`, () => {
        expect(instance.getNumber("123 4")).toBe(1234);
      });
      it(`"123.4" => 123.4`, () => {
        expect(instance.getNumber("123.4")).toBe(123.4);
      });
      it(`".1234" => 0.1234`, () => {
        expect(instance.getNumber(".1234")).toBe(0.1234);
      });
      it(`"-1234" => -1234`, () => {
        expect(instance.getNumber("-1234")).toBe(-1234);
      });
      it(`"-1.234" => -1.234`, () => {
        expect(instance.getNumber("-1.234")).toBe(-1.234);
      });
    });
    describe("strings (+ numbers)", () => {
      it(`"asdf => NaN`, () => {
        expect(instance.getNumber("asdf")).toBe(NaN);
      });
      it(`"123 asdf" => 123`, () => {
        expect(instance.getNumber("123 asdf")).toBe(123);
      });
      it(`"123 asdf 123 => 123123`, () => {
        expect(instance.getNumber("123 asdf 123")).toBe(123123);
      });
      it(`"-123 asdf 123 => -123123`, () => {
        expect(instance.getNumber("-123 asdf 123")).toBe(-123123);
      });
      it(`"123 asdf -123 => ????`, () => {
        expect(instance.getNumber("123 asdf -123")).toBe(123123);
      });
      it(`"-12.3 asdf 123 => -12.3123`, () => {
        expect(instance.getNumber("-12.3 asdf 123")).toBe(-12.3123);
      });
      it(`"-1.23 asdf => -1.23`, () => {
        expect(instance.getNumber("-1.23 asdf")).toBe(-1.23);
      });
    });
    describe("misc", () => {
      it(`"-" => - `, () => {
        expect(instance.getNumber("-")).toBe("-");
      });
      it(`"." => NaN `, () => {
        expect(instance.getNumber(".")).toBe(NaN);
      });
      it(`"//%?" => NaN `, () => {
        expect(instance.getNumber("//%?")).toBe(NaN);
      });
      it(`null => NaN `, () => {
        expect(instance.getNumber(null)).toBe(NaN);
      });
      it(`undefined => NaN `, () => {
        expect(instance.getNumber(null)).toBe(NaN);
      });
      it(`"" => - `, () => {
        expect(instance.getNumber("")).toBe("-");
      });
    });
  });
  describe("incr/decr", () => {
    let wrapper, instance, component;
    let unitInUsePTR, unitConfig, minVal, maxVal, unitConfigInUse;
    let minValValue, maxValValue;
    beforeEach(() => {
      wrapper = shallow(
        <QInput unitConfig={MemoryFromUnits} minVal="0 MiB" maxVal="10 GiB" />
      );
      instance = wrapper.instance();
      component = mount(
        <QInput unitConfig={MemoryFromUnits} minVal="0 MiB" maxVal="10 GiB" />
      );

      [unitInUsePTR, unitConfig, minVal, maxVal, unitConfigInUse] = [
        0,
        MemoryFromUnits,
        component.props().minVal,
        component.props().maxVal,
        component.props().unitConfigInUse,
      ];
      minValValue = instance.getNumber(component.props().minVal);
      maxValValue = instance.getNumber(component.props().maxVal);
    });
    afterEach(() => {
      component.unmount();
    });
    describe("increment(number, unitInUsePTR, unitConfig, minVal, maxVal, unitConfigInUse)", () => {
      it(`"" => minVal`, () => {});
      it(`"-" => minVal`, () => {});
      it(`"0"+ => 1 MiB`, () => {});
      it(`"0"++ => 2 MiB`, () => {});
      it(`stops at maxVal`, () => {});
      describe("misc", () => {
        it(`null => minVal`, () => {});
        it(`undefined => minVal`, () => {});
        it(`NaN => minVal`, () => {});
      });
    });
    describe("decrement(number, unitInUsePTR, unitConfig, minVal, maxVal, unitConfigInUse)", () => {
      it(`"" => minVal`, () => {});
      it(`"-" => minVal`, () => {});
      it(`"0"- => minVal`, () => {});
      it(`"1"- => 0 MiB`, () => {});
      it(`"2" => 0 MiB`, () => {});
      it(`stops at minVal`, () => {});
      describe("misc", () => {
        it(`null => minVal`, () => {});
        it(`undefined => minVal`, () => {});
        it(`NaN => minVal`, () => {});
      });
    });
  });
  describe("convert(number, unitInUsePTR, unit, unitConfig)", () => {
    let wrapper, instance, component;
    let unitInUsePTR, unitConfig, unit, number;
    beforeEach(() => {
      wrapper = shallow(
        <QInput unitConfig={MemoryFromUnits} minVal="0 MiB" maxVal="10 GiB" />
      );
      instance = wrapper.instance();
      component = mount(
        <QInput unitConfig={MemoryFromUnits} minVal="0 MiB" maxVal="10 GiB" />
      );
    });
    afterEach(() => {
      component.unmount();
    });
    it("converts from 1 -> 2", () => {
      [unitInUsePTR, unitConfig, unit] = [0, MemoryFromUnits, "MiB"];
      number = MemoryFromUnits[unitInUsePTR].convertUpAt;
      expect(instance.convert(number, unitInUsePTR, unit, unitConfig)).toEqual({
        number: 1,
        unit: "GiB",
        unitPTR: 1,
      });
    });
    it("converts from 2 -> 3", () => {
      [unitInUsePTR, unitConfig, unit] = [1, MemoryFromUnits, "GiB"];
      number = MemoryFromUnits[unitInUsePTR].convertUpAt;
      expect(instance.convert(number, unitInUsePTR, unit, unitConfig)).toEqual({
        number: 1,
        unit: "TiB",
        unitPTR: 2,
      });
    });
    it("converts from 3 -> 2", () => {
      [unitInUsePTR, unitConfig, unit] = [2, MemoryFromUnits, "TiB"];
      number = 1 - MemoryFromUnits[unitInUsePTR].standardStepSize;
      expect(instance.convert(number, unitInUsePTR, unit, unitConfig)).toEqual({
        number:
          MemoryFromUnits[unitInUsePTR - 1].convertUpAt -
          MemoryFromUnits[unitInUsePTR - 1].standardStepSize,
        unit: "GiB",
        unitPTR: 1,
      });
    });
    it("converts from 2 -> 1", () => {
      [unitInUsePTR, unitConfig, unit] = [1, MemoryFromUnits, "GiB"];
      number = 1 - MemoryFromUnits[unitInUsePTR].standardStepSize;
      expect(instance.convert(number, unitInUsePTR, unit, unitConfig)).toEqual({
        number:
          MemoryFromUnits[unitInUsePTR - 1].convertUpAt -
          MemoryFromUnits[unitInUsePTR - 1].standardStepSize,
        unit: "MiB",
        unitPTR: 0,
      });
    });
    it("doesnt convert above biggest unit", () => {
      [unitInUsePTR, unitConfig, unit] = [2, MemoryFromUnits, "TiB"];
      number = MemoryFromUnits[unitInUsePTR].convertUpAt;
      expect(instance.convert(number, unitInUsePTR, unit, unitConfig)).toEqual({
        number: number,
        unit: "TiB",
        unitPTR: 2,
      });
    });
    it("doesnt convert below smallest unit", () => {
      [unitInUsePTR, unitConfig, unit] = [0, MemoryFromUnits, "MiB"];
      number = 1 - MemoryFromUnits[unitInUsePTR].standardStepSize;
      expect(instance.convert(number, unitInUsePTR, unit, unitConfig)).toEqual({
        number: number,
        unit: "MiB",
        unitPTR: 0,
      });
    });
  });
  describe("unitMatch(string, unitConfig)", () => {
    let wrapper, instance, component;
    let unitConfig;
    beforeEach(() => {
      wrapper = shallow(
        <QInput unitConfig={MemoryFromUnits} minVal="0 MiB" maxVal="10 GiB" />
      );
      instance = wrapper.instance();
      component = mount(
        <QInput unitConfig={MemoryFromUnits} minVal="0 MiB" maxVal="10 GiB" />
      );
      unitConfig = component.props().unitConfig;
    });
    afterEach(() => {
      component.unmount();
    });
    it("1st unit => √", () => {
      let unit = unitConfig[0].unit;
      expect(instance.unitMatch(unit, unitConfig)).toBe(0);
    });
    it("2nd unit => √", () => {
      let unit = unitConfig[1].unit;
      expect(instance.unitMatch(unit, unitConfig)).toBe(1);
    });
    it("1st unit UPPERCASE => √", () => {
      let unit = unitConfig[0].unit.toUpperCase();
      expect(instance.unitMatch(unit, unitConfig)).toBe(0);
    });
    it("1st unit lowercase => √", () => {
      let unit = unitConfig[0].unit.toLowerCase();
      expect(instance.unitMatch(unit, unitConfig)).toBe(0);
    });
    it("1st unit shortUnit => √", () => {
      let unit = unitConfig[0].shortUnit;
      expect(instance.unitMatch(unit, unitConfig)).toBe(0);
    });
    it(`"" => notValid => notValid`, () => {
      let unit = "";
      expect(instance.unitMatch(unit, unitConfig)).toBe("notValid");
    });
    it("1st unit + additional Characters => notValid", () => {});
    describe("misc", () => {
      it("null => notValid", () => {
        let unit = null;
        expect(instance.unitMatch(unit, unitConfig)).toBe("notValid");
      });
      it("undefined => notValid", () => {
        let unit = undefined;
        expect(instance.unitMatch(unit, unitConfig)).toBe("notValid");
      });
    });
  });
  describe("validate(userInput, unitConfig, minVal (1), maxVal)", () => {
    let wrapper, instance, component;
    let unitConfig, minVal, maxVal;
    beforeEach(() => {
      wrapper = shallow(
        <QInput unitConfig={MemoryFromUnits} minVal="0 MiB" maxVal="10 GiB" />
      );
      instance = wrapper.instance();
      component = mount(
        <QInput unitConfig={MemoryFromUnits} minVal="1 MiB" maxVal="10 GiB" />
      );
      unitConfig = component.props().unitConfig;
      minVal = component.props().minVal;
      maxVal = component.props().maxVal;
    });
    afterEach(() => {
      component.unmount();
    });
    describe("should be valid", () => {
        it("non string integers only", () => {
            let input = 22;
            expect(
              instance.validate(input, unitConfig, minVal, maxVal).isValid
            ).toBe(true);
          });
      it("integers only", () => {
        let input = `22`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(true);
      });
      it("decimal only", () => {
        let input = `22.3`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(true);
      });
      it("Number with 1st Unit", () => {
        let input = `23${unitConfig[0].unit}`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(true);
      });
      it("Number with 2nd Unit", () => {
        let input = `23 ${unitConfig[1].unit}`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(true);
      });
      it("Number with shorthand", () => {
        let input = `12 ${unitConfig[1].shortUnit}`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(true);
      });
      it("-", () => {
        let input = `-`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(true);
      });
      it(`""`, () => {});
      it("Value at minVal", () => {
        let input = `${minVal}`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(true);
      });
      it("Value at maxVal", () => {
        let input = `${maxVal}`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(true);
      });
      it("Value between min max", () => {
          let minValValue = instance.getNumber(component.props().minVal);
          let minValUnit = component.props().minVal.match(/[a-z]+/gi).join("");
        let input = `${minValValue} ${minValUnit}`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(true);
      });
    });
    describe("should be invalid", () => {
      it("random letters", () => {
        let input = `asdf`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(false);
      });
      it("special Characters", () => {
        let input = `-?`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(false);
      });
      it("[Number] [Unit] [Number]", () => {
        let input = `12 ${unitConfig[0].unit} 12`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(false);
      });
      it("Unit only", () => {
        let input = `${unitConfig[0].unit}`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(false);
      });
      it("Number with 2 Units", () => {
        let input = `1 ${unitConfig[0].unit} ${unitConfig[1].unit} `;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(false);
      });
      it("Value below minVal", () => {
        let minValValue = instance.getNumber(component.props().minVal);
        let minValUnit = component.props().minVal.match(/[a-z]+/gi).join("");
        let input = `${minValValue - 1} ${minValUnit}`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(false);
      });
      it("Value above maxVal", () => {
        let maxValValue = instance.getNumber(component.props().maxVal);
        let maxValUnit = component.props().maxVal.match(/[a-z]+/gi).join("");
        let input = `${maxValValue + 1} ${maxValUnit}`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(false);
      });
    });
    describe("misc", () => {
      it("invoked on null -> invalid", () => {
        let input = null;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(false);
      });
      it("invoked on undefined -> invalid", () => {
        let input = undefined;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(false);
      });
    });
    describe("sets new unitPTR correctly", () => {
      it("1st unit", () => {
        let input = `12 ${unitConfig[0].unit}`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).unitPTR
        ).toBe(0);
      });
      it("2nd unit", () => {
        let input = `12 ${unitConfig[1].unit}`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).unitPTR
        ).toBe(1);
      });
      it("resets", () => {
        let input = `12`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).unitPTR
        ).toBe(0);
      });
    });
  });
  describe("checkMinMax(input, minVal, maxVal, unit, unitConfig, unitConfigInUse)", () => {
    let wrapper, instance, component;
    let unitInUsePTR, unitConfig, minVal, maxVal, unitConfigInUse;
    let minValValue, maxValValue;
    beforeEach(() => {
      wrapper = shallow(
        <QInput unitConfig={MemoryFromUnits} minVal="0 MiB" maxVal="10 GiB" />
      );
      instance = wrapper.instance();
      component = mount(
        <QInput unitConfig={MemoryFromUnits} minVal="0 MiB" maxVal="10 GiB" />
      );

      [unitInUsePTR, unitConfig, minVal, maxVal, unitConfigInUse] = [
        0,
        MemoryFromUnits,
        component.props().minVal,
        component.props().maxVal,
        component.props().unitConfigInUse,
      ];
      minValValue = instance.getNumber(component.props().minVal);
      maxValValue = instance.getNumber(component.props().maxVal);
    });
    afterEach(() => {
      component.unmount();
    });
    it("jumps to minVal", () => {});
    it("jumps to maxVal", () => {});
    it("returns as is at no violation", () => {});
  });
  describe("convertValueToCPU(val)", () => {});
  describe("addUnit(userInput, unit, isValid)", () => {});
  describe("onClick(buttonID, unitInUsePTR)", () => {});
  describe("onChange(event)", () => {});
  describe("populateToParent(value, unitConfigInUse)", () => {});
});
describe("mock user interaction", () => {});
