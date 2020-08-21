import React from "react";
import Enzyme, { shallow, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import App from "../components/QInput/App";
import QInput from "../components/QInput/QInput";

Enzyme.configure({ adapter: new Adapter() });

describe("mount test", () => {
 it("mounts", () => {
     const component = mount(<QInput />);
 });
});