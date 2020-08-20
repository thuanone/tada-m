import React from "react";
import Enzyme, { shallow } from "enzyme";
import { mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import {App} from "../components/QInput/App";

Enzyme.configure({ adapter: new Adapter() });

describe("mount test", () => {
 it("mounts", () => {
     console.log();
     const component = mount(<App />);
 });
});