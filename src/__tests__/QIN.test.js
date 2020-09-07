import React from "react";
import Enzyme, { shallow, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import QInput from "../components/QInput";
import QInputPage from "../content/QInputPage";
import { vCPU as vCPUFromUnits } from "../components/QInput/units";
import { Memory_1 as MemoryFromUnits } from "../components/QInput/units";
import { noUnit as noUnitFromUnits } from "../components/QInput/units";

Enzyme.configure({ adapter: new Adapter() });

describe("hello", () => {
    it("loads", () => {});
    it("mount", () => {
        let component = mount(<QInput />);
    });
    it("wrapper", () => {
        let wrapper = shallow(<QInput/>);
    });
});