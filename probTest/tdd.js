const { configs } = require("eslint-plugin-prettier");

const newFunctions = {
  increment: (number, unitInUsePTR, Config) => {
    let stepsize = Config.unitConfig[unitInUsePTR].standardStepSize;
    return number + stepsize > Config.general.maxVal
      ? { number: number, message: "maxVal reached" }
      : { number: number + stepsize, message: "" };
  },
  decrement: (number, unitInUsePTR, Config) => {
    let stepsize = Config.unitConfig[unitInUsePTR].standardStepSize;
    return number - stepsize < Config.general.minVal
      ? { number: number, message: "minVal reached" }
      : { number: number - stepsize, message: "" };
  },
};

module.exports = newFunctions;
