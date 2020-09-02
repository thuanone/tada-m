import React from "react";
import Enzyme, { shallow, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import QInput from "../components/QInput";
import QInputPage from "../content/QInputPage";
import { vCPU as vCPUFromUnits } from "../components/QInput/units";
import { Memory_1 as MemoryFromUnits } from "../components/QInput/units";
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
    let minValValue, maxValValue, stepSize;
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
      stepSize = unitConfig[unitInUsePTR].standardStepSize;
    });
    afterEach(() => {
      component.unmount();
    });
    describe("increment(number, unitInUsePTR, unitConfig, minVal, maxVal, unitConfigInUse)", () => {
      it(`"" => minVal + 1 step`, () => {
        let number = "";
        expect(
          instance.increment(
            number,
            unitInUsePTR,
            unitConfig,
            minVal,
            maxVal,
            unitConfigInUse
          ).number
        ).toBe(minValValue + stepSize);
      });
      it(`"-" => minVal`, () => {
        let number = "-";
        expect(
          instance.increment(
            number,
            unitInUsePTR,
            unitConfig,
            minVal,
            maxVal,
            unitConfigInUse
          ).number
        ).toBe(minValValue);
      });
      it(`"0"+ => 1 MiB`, () => {
        let number = "0";
        expect(
          instance.increment(
            number,
            unitInUsePTR,
            unitConfig,
            minVal,
            maxVal,
            unitConfigInUse
          ).number
        ).toBe(0 + stepSize);
      });
      it(`"0"++ => 2 MiB`, () => {
        let number = "0";
        let onceIncremented = instance.increment(
          number,
          unitInUsePTR,
          unitConfig,
          minVal,
          maxVal,
          unitConfigInUse
        ).number;
        expect(
          instance.increment(
            onceIncremented,
            unitInUsePTR,
            unitConfig,
            minVal,
            maxVal,
            unitConfigInUse
          ).number
        ).toBe(stepSize + stepSize);
      });
      it(`stops at maxVal`, () => {
        let number = minValValue;
        let i, newNumber;
        let unitToTest = 0;
        maxVal = `1 ${unitConfig[unitToTest].unit}`;
        for (i = 0; i < unitConfig[unitToTest].convertUpAt + 20; i++) {
          newNumber = instance.increment(
            number,
            unitInUsePTR,
            unitConfig,
            minVal,
            maxVal,
            unitConfigInUse
          );
          number = newNumber.number;
          unitInUsePTR = newNumber.unitPTR;
        }
        expect(number).toBe(instance.getNumber(maxVal));
      });
      describe("misc", () => {
        it(`null => minVal`, () => {
          let number = "";
          expect(
            instance.increment(
              number,
              unitInUsePTR,
              unitConfig,
              minVal,
              maxVal,
              unitConfigInUse
            ).number
          ).toBe(minValValue);
        });
        it(`undefined => minVal`, () => {
          let number = undefined;
          expect(
            instance.increment(
              number,
              unitInUsePTR,
              unitConfig,
              minVal,
              maxVal,
              unitConfigInUse
            ).number
          ).toBe(minValValue);
        });
        it(`NaN => minVal`, () => {
          let number = "";
          expect(
            instance.increment(
              number,
              unitInUsePTR,
              unitConfig,
              minVal,
              maxVal,
              unitConfigInUse
            ).number
          ).toBe(minValValue);
        });
      });
    });
    describe("decrement(number, unitInUsePTR, unitConfig, minVal, maxVal, unitConfigInUse)", () => {
      it(`"" => minVal`, () => {
        let number = "";
        expect(
          instance.decrement(
            number,
            unitInUsePTR,
            unitConfig,
            minVal,
            maxVal,
            unitConfigInUse
          ).number
        ).toBe(minValValue);
      });
      it(`"-" => minVal`, () => {
        let number = "-";
        expect(
          instance.decrement(
            number,
            unitInUsePTR,
            unitConfig,
            minVal,
            maxVal,
            unitConfigInUse
          ).number
        ).toBe(minValValue);
      });
      it(`"0"- => minVal`, () => {
        let number = "0";
        expect(
          instance.decrement(
            number,
            unitInUsePTR,
            unitConfig,
            minVal,
            maxVal,
            unitConfigInUse
          ).number
        ).toBe(minValValue);
      });
      it(`"1"- => 0 MiB`, () => {
        let number = "1";
        expect(
          instance.decrement(
            number,
            unitInUsePTR,
            unitConfig,
            minVal,
            maxVal,
            unitConfigInUse
          ).number
        ).toBe(1 - stepSize);
      });
      it(`"2"-- => 0 MiB`, () => {
        let number = "2";
        let onceDecremented = instance.decrement(
          number,
          unitInUsePTR,
          unitConfig,
          minVal,
          maxVal,
          unitConfigInUse
        ).number;
        expect(
          instance.decrement(
            onceDecremented,
            unitInUsePTR,
            unitConfig,
            minVal,
            maxVal,
            unitConfigInUse
          ).number
        ).toBe(2 - stepSize - stepSize);
      });
      it(`stops at minVal`, () => {
        minVal = "1 MiB";
        minValValue = instance.getNumber(minVal);
        let number = minValValue + 120;
        let i, newNumber;
        for (i = 0; i < unitConfig[0].convertUpAt + 20; i++) {
          newNumber = instance.decrement(
            number,
            unitInUsePTR,
            unitConfig,
            minVal,
            maxVal,
            unitConfigInUse
          );
          number = newNumber.number;
          unitInUsePTR = newNumber.unitPTR;
        }
        expect(number).toBe(instance.getNumber(minVal));
      });
      describe("misc", () => {
        it(`null => minVal`, () => {
          let number = null;
          expect(
            instance.decrement(
              number,
              unitInUsePTR,
              unitConfig,
              minVal,
              maxVal,
              unitConfigInUse
            ).number
          ).toBe(minVal);
        });
        it(`undefined => minVal`, () => {
          let number = undefined;
          expect(
            instance.decrement(
              number,
              unitInUsePTR,
              unitConfig,
              minVal,
              maxVal,
              unitConfigInUse
            ).number
          ).toBe(minVal);
        });
        it(`NaN => minVal`, () => {
          let number = NaN;
          expect(
            instance.decrement(
              number,
              unitInUsePTR,
              unitConfig,
              minVal,
              maxVal,
              unitConfigInUse
            ).number
          ).toBe(minVal);
        });
      });
    });
  });
  describe("convert(number, unitInUsePTR, unit, unitConfig)", () => {
    let wrapper, instance, component;
    let unitInUsePTR, unitConfig, unit, number;
    beforeEach(() => {
      wrapper = shallow(
        <QInput unitConfig={MemoryFromUnits} minVal="1 MiB" maxVal="10 GiB" />
      );
      instance = wrapper.instance();
      component = mount(
        <QInput unitConfig={MemoryFromUnits} minVal="1 MiB" maxVal="10 GiB" />
      );
    });
    afterEach(() => {
      component.unmount();
    });
    it("converts from 1 -> 2", () => {
      [unitInUsePTR, unitConfig] = [0, MemoryFromUnits];
      unit = unitConfig[unitInUsePTR].unit;
      number = unitConfig[unitInUsePTR].convertUpAt;
      expect(instance.convert(number, unitInUsePTR, unit, unitConfig)).toEqual({
        number: 1,
        unit: unitConfig[unitInUsePTR + 1].unit,
        unitPTR: unitInUsePTR + 1,
      });
    });
    it("converts from 2 -> 3", () => {
      [unitInUsePTR, unitConfig] = [1, MemoryFromUnits];
      unit = unitConfig[unitInUsePTR].unit;
      number = unitConfig[unitInUsePTR].convertUpAt;
      expect(instance.convert(number, unitInUsePTR, unit, unitConfig)).toEqual({
        number: 1,
        unit: unitConfig[unitInUsePTR + 1].unit,
        unitPTR: unitInUsePTR + 1,
      });
    });
    it("converts from 3 -> 2", () => {
      [unitInUsePTR, unitConfig] = [2, MemoryFromUnits];
      unit = unitConfig[unitInUsePTR].unit;
      number = 1 - unitConfig[unitInUsePTR].standardStepSize;
      expect(instance.convert(number, unitInUsePTR, unit, unitConfig)).toEqual({
        number:
          unitConfig[unitInUsePTR - 1].convertUpAt -
          unitConfig[unitInUsePTR - 1].standardStepSize,
        unit: unitConfig[unitInUsePTR - 1].unit,
        unitPTR: unitInUsePTR - 1,
      });
    });
    it("converts from 2 -> 1", () => {
      [unitInUsePTR, unitConfig] = [1, MemoryFromUnits];
      unit = unitConfig[unitInUsePTR].unit;
      number = 1 - unitConfig[unitInUsePTR].standardStepSize;
      expect(instance.convert(number, unitInUsePTR, unit, unitConfig)).toEqual({
        number:
          unitConfig[unitInUsePTR - 1].convertUpAt -
          unitConfig[unitInUsePTR - 1].standardStepSize,
        unit: unitConfig[unitInUsePTR - 1].unit,
        unitPTR: unitInUsePTR - 1,
      });
    });
    it("doesnt convert above biggest unit", () => {
      [unitInUsePTR, unitConfig] = [4, MemoryFromUnits];
      unit = unitConfig[unitInUsePTR].unit;
      number = unitConfig[unitInUsePTR].convertUpAt;
      expect(instance.convert(number, unitInUsePTR, unit, unitConfig)).toEqual({
        number: number,
        unit: unit,
        unitPTR: unitInUsePTR,
      });
    });
    it("doesnt convert below smallest unit", () => {
      [unitInUsePTR, unitConfig] = [0, MemoryFromUnits];
      unit = unitConfig[unitInUsePTR].unit;
      number = 1 - unitConfig[unitInUsePTR].standardStepSize;
      expect(instance.convert(number, unitInUsePTR, unit, unitConfig)).toEqual({
        number: number,
        unit: unit,
        unitPTR: unitInUsePTR,
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
        <QInput unitConfig={MemoryFromUnits} minVal="1 MiB" maxVal="10 TiB" defaultUnit={2}/>
      );
      instance = wrapper.instance();
      component = mount(
        <QInput unitConfig={MemoryFromUnits} minVal="1 MiB" maxVal="10 TiB" defaultUnit={2}/>
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
        console.log(instance.validate(input, unitConfig, minVal, maxVal).message);
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
        minVal = `0 ${unitConfig[0].unit}`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(true);
      });
      it("Number with 2nd Unit", () => {
        let input = `23 ${unitConfig[1].unit}`;
        minVal = `0 ${unitConfig[0].unit}`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(true);
      });
      it("Number with shorthand", () => {
        let input = `12 ${unitConfig[1].shortUnit}`;
        minVal = `0 ${unitConfig[0].unit}`;
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
        let minValUnit = component
          .props()
          .minVal.match(/[a-z]+/gi)
          .join("");
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
        let minValUnit = component
          .props()
          .minVal.match(/[a-z]+/gi)
          .join("");
        let input = `${minValValue - 1} ${minValUnit}`;
        expect(
          instance.validate(input, unitConfig, minVal, maxVal).isValid
        ).toBe(false);
      });
      it("Value above maxVal", () => {
        let maxValValue = instance.getNumber(component.props().maxVal);
        let maxValUnit = component
          .props()
          .maxVal.match(/[a-z]+/gi)
          .join("");
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
        ).toBe(component.props().defaultUnit);
      });
    });
  });
  describe("checkMinMax(number, minVal, maxVal, unitPTR, unitConfig)", () => {
    let wrapper, instance, component;
    let minVal, maxVal, unitPTR, unitConfig;
    let minValValue,
      maxValValue,
      minValUnitPTR,
      maxValUnitPTR,
      minValUnit,
      maxValUnit;
    beforeEach(() => {
      wrapper = shallow(
        <QInput unitConfig={MemoryFromUnits} minVal="1 MiB" maxVal="10 GiB" />
      );
      instance = wrapper.instance();
      component = mount(
        <QInput unitConfig={MemoryFromUnits} minVal="1 MiB" maxVal="10 GiB" />
      );

      [unitPTR, unitConfig, minVal, maxVal] = [
        2,
        MemoryFromUnits,
        component.props().minVal,
        component.props().maxVal,
        component.props().unitConfigInUse,
      ];
      minValValue = instance.getNumber(component.props().minVal);
      maxValValue = instance.getNumber(component.props().maxVal);

      minValUnit = minVal.match(/[a-z]+/gi).join("");
      maxValUnit = maxVal.match(/[a-z]+/gi).join("");

      minValUnitPTR = instance.unitMatch(minValUnit, unitConfig);
      maxValUnitPTR = instance.unitMatch(maxValUnit, unitConfig);
    });
    afterEach(() => {
      component.unmount();
    });
    it("jumps to minVal", () => {
      let number = minValValue - unitConfig[minValUnitPTR].standardStepSize;
      let unitInUsePTR = minValUnitPTR-1;
      expect(
        instance.checkMinMax(number, minVal, maxVal, unitInUsePTR, unitConfig)
          .number
      ).toBe(minValValue);
      expect(
        instance.checkMinMax(number, minVal, maxVal, unitInUsePTR, unitConfig)
          .unit
      ).toBe(minValUnit);
      expect(
        instance.checkMinMax(number, minVal, maxVal, unitInUsePTR, unitConfig)
          .unitPTR
      ).toBe(minValUnitPTR);
    });
    it("jumps to maxVal", () => {
      let number = maxValValue + unitConfig[maxValUnitPTR].standardStepSize;
      let unitInUsePTR = maxValUnitPTR;
      expect(
        instance.checkMinMax(number, minVal, maxVal, unitInUsePTR, unitConfig)
          .number
      ).toBe(maxValValue);
      expect(
        instance.checkMinMax(number, minVal, maxVal, unitInUsePTR, unitConfig)
          .unit
      ).toBe(maxValUnit);
      expect(
        instance.checkMinMax(number, minVal, maxVal, unitInUsePTR, unitConfig)
          .unitPTR
      ).toBe(maxValUnitPTR);
    });
    it("returns as is at no violation", () => {
      let number = minValValue + unitConfig[minValUnitPTR].standardStepSize;
      let unitInUsePTR = minValUnitPTR;
      expect(
        instance.checkMinMax(number, minVal, maxVal, unitInUsePTR, unitConfig)
          .number
      ).toBe(number);
      expect(
        instance.checkMinMax(number, minVal, maxVal, unitInUsePTR, unitConfig)
          .unit
      ).toBe(minValUnit);
      expect(
        instance.checkMinMax(number, minVal, maxVal, unitInUsePTR, unitConfig)
          .unitPTR
      ).toBe(minValUnitPTR);
    });
  });
  describe("convertValueToBaseUnit", () => {
    let wrapper, instance, component;
    beforeEach(() => {
      wrapper = shallow(<QInput />);
      instance = wrapper.instance();
      component = mount(<QInput />);
    });
    afterEach(() => {
      component.unmount();
    });
    describe("MemoryUnit", () => {
      let unitConfig, number, unitPTR;
      beforeEach(() => {
        unitConfig = MemoryFromUnits;
      });
      it("1 MiB => 1048576 byte", () => {
        expect(instance.convertValueToBaseUnit(1, 2, unitConfig)).toBe(1048576);
      });
      it("1.5 MiB => 1572864 byte", () => {
        expect(instance.convertValueToBaseUnit(1.5, 2, unitConfig)).toBe(
          1572864
        );
      });
      it("-1.5 MiB => - 1572864 byte", () => {
        expect(instance.convertValueToBaseUnit(-1.5, 2, unitConfig)).toBe(
          -1572864
        );
      });
      it("23 GiB => 24696061952 byte", () => {
        expect(instance.convertValueToBaseUnit(23, 3, unitConfig)).toBe(
          24696061952
        );
      });
      it("23 TiB => 24696061952 byte", () => {
        expect(instance.convertValueToBaseUnit(23, 4, unitConfig)).toBe(
          25288767438848
        );
      });
    });
  });
  describe("onClick(buttonID, unitInUsePTR)", () => {});
  describe("onChange(event)", () => {});
  describe("populateToParent(value)", () => {});
});
describe("mock user interaction", () => {});
describe("user interaction mock, indirect test", () => {
  describe("JSX Tag as is", () => {
    let component, incr, decr, inputField;
    beforeEach(() => {
      component = mount(<QInput />);
      expect(component.props()).toBeDefined();
      incr = component.find("button#incrementButton");
      decr = component.find("button#decrementButton");
      inputField = component.find("input");
    });
    afterEach(() => {
      component.unmount();
    });
    it("user doesnt reach negatives by decr", () => {
      let i;
      let number;
      const instance = shallow(<QInput />).instance();
      for (i = 0; i < 10; i++) {
        incr.simulate("mousedown");
      }
      number = instance.getNumber(component.state().value);
      expect(number).not.toBeLessThan(0);
    });
    it("typed negatives are invalid", () => {
      inputField.simulate("change", { target: { value: "-100" } });
      expect(component.state().value).toBe("-100");
      expect(component.state().isValid).toBe(false);
    });
    it("typed negatives throw error message", () => {
      inputField.simulate("change", { target: { value: "-100" } });
      expect(component.state().value).toBe("-100");
      expect(component.state().message).not.toBe("");
    });
    it("typed negatives and further decrementing is stopped", () => {
      inputField.simulate("change", { target: { value: "-100" } });
      incr.simulate("mousedown");
      expect(component.state().value).toBe("-100"); //noChange
    });
    describe("base functionalities", () => {
      it("increments", () => {
        const curr = shallow(<QInput />)
          .instance()
          .getNumber(component.state().value);
        let newVal;
        incr.simulate("mousedown");
        newVal = shallow(<QInput />)
          .instance()
          .getNumber(component.state().value);
        expect(newVal).toBeGreaterThan(curr);
      });
      it("decrements", () => {
        incr.simulate("mousedown");
        incr.simulate("mousedown");
        const curr = shallow(<QInput />)
          .instance()
          .getNumber(component.state().value);
        let newVal;
        decr.simulate("mousedown");

        newVal = shallow(<QInput />)
          .instance()
          .getNumber(component.state().value);
        expect(newVal).toBeLessThan(curr);
      });
      it("changes input", () => {
        const curr = component.state().value;
        inputField.simulate("change", { target: { value: "somethingElse" } });
        const newVal = component.state().value;
        expect(curr).not.toEqual(newVal);
      });
    });
  });
  describe(`JSX Tag with minVal = 7, can user reach below minVal?`, () => {
    let component, incr, decr, inputField;
    beforeEach(() => {
      component = mount(<QInput minVal="7 MiB" />);
      expect(component.props()).toBeDefined();
      incr = component.find("button#incrementButton");
      decr = component.find("button#decrementButton");
      inputField = component.find("input");
    });
    afterEach(() => {
      component.unmount();
    });
    it("decrement after default returns minVal", () => {
      decr.simulate("mousedown");
      expect(component.state().value).toBe("7 MiB");
    });
    it("incrememt after (default = below minval) returns minVal", () => {
      incr.simulate("mousedown");
      expect(component.state().value).toBe("7 MiB");
    });
    describe("user forces himself under minVal by typing", () => {
      beforeEach(() => {
        inputField.simulate("change", { target: { value: 4 } });
      });
      it("is error message thrown?", () => {
        expect(component.state().message).not.toBe("");
      });
      it("is value invalid??", () => {
        expect(component.state().isValid).toBe(false);
      });
      describe("user incr/decr afterwards", () => {
        it("further decr isnt possible", () => {
          let newVal;
          decr.simulate("mousedown");
          newVal = shallow(<QInput />)
            .instance()
            .getNumber(component.state().value);
          expect(newVal).not.toBeLessThan(7);
          expect(newVal).toBe(7);
        });
        it("increments works under minVal", () => {
          const curr = shallow(<QInput />)
            .instance()
            .getNumber(component.state().value);
          let newVal;
          incr.simulate("mousedown");
          newVal = shallow(<QInput />)
            .instance()
            .getNumber(component.state().value);
          expect(newVal).toBeGreaterThan(curr);
        });
        it("incr jumps to minVal", () => {
          incr.simulate("mousedown");
          let val = shallow(<QInput />)
            .instance()
            .getNumber(component.state().value);
          let min = shallow(<QInput />)
            .instance()
            .getNumber(component.props().minVal);
          expect(val).toEqual(min);
        });
        it("incr under minVal turns value valid", () => {
          incr.simulate("mousedown");
          expect(component.state().isValid).toBe(true);
          expect(component.state().message).not.toBe("");
        });
      });
    });
  });
});
