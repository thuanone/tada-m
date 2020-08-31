class checkMnMx {
  /**
   * this function checks whether a quantity is under/above a set min/max Value and returns an Object containing
   * a number, which is either the number passed or min/max-Val's number
   * a message,
   * and a corresponding unit for number
   *
   * @param {Number} input - number to be checked
   * @param {String} unit - corresponding unit to number
   * @param {String} minVal - string in form "NUMBER UNIT"
   * @param {String} maxVal - string in form "NUMBER UNIT"
   * @param {Array} unitConfig - Array of nested Objects which contain information about a unit
   */
  checkMinMax1(input, minVal, maxVal, unit, unitConfig, unitConfigInUse) {
    let checked = {
      number: input,
      message: "",
      unit: unit,
      unitPTR: this.unitMatch(unit, unitConfig),
    };
    if (unitConfigInUse === "Memory") {
      // if Memory is used e.g. MiB, GiB, MB, GB
      let minValByte = this.MemoryUtils.convertValueToBytes(minVal);
      let maxValByte = this.MemoryUtils.convertValueToBytes(maxVal);
      let inputByte = this.MemoryUtils.convertValueToBytes(input + unit);

      //special case for minVal = "0 UNIT" because convertValueToBytes doesnt handle negative values
      if (
        this.getNumber(minVal) === 0 &&
        minVal.match("MiB") &&
        input < this.getNumber(minVal)
      ) {
        let minValUnit = minVal.match(/[a-z]+/gi).join(""); // extracting unit from maxVal
        checked.number = this.getNumber(minVal);
        checked.unitPTR = this.unitMatch(minValUnit, unitConfig);
        checked.unit = unitConfig[checked.unitPTR].unit;
        checked.message = "minVal reached";
        return checked;
      }
      //if input is within borders of min/max
      if (minValByte <= inputByte && inputByte <= maxValByte) {
        return checked;
      }
      // jumping to maxVal
      if (inputByte > maxValByte) {
        let maxValUnit = maxVal.match(/[a-z]+/gi).join(""); // extracting unit from maxVal
        checked.number = this.getNumber(maxVal);
        checked.message = "maxVal reached";
        checked.unitPTR = this.unitMatch(maxValUnit, unitConfig);
        checked.unit = unitConfig[checked.unitPTR].unit;
        return checked;
      }
      // jumping to minVal
      if (inputByte < minValByte) {
        let minValUnit = minVal.match(/[a-z]+/gi).join(""); // extracting unit from maxVal
        checked.number = this.getNumber(minVal);
        checked.message = "minVal reached";
        checked.unitPTR = this.unitMatch(minValUnit, unitConfig);
        checked.unit = unitConfig[checked.unitPTR].unit;
        return checked;
      }
      return checked;
    }
    if (unitConfigInUse === "vCPU") {
      // if vCPU is used, e.g. m , vCPU
      let minValCPU = this.convertValuetoCPU(minVal);
      let maxValCPU = this.convertValuetoCPU(maxVal);
      let inputCPU = this.convertValuetoCPU(input + unit);

      if (minValCPU <= inputCPU && maxValCPU >= inputCPU) {
        return checked;
      }

      if (inputCPU < minValCPU) {
        checked.number = this.getNumber(minVal);
        checked.message = "minVal reached";

        minVal = minVal.match(/[a-z]+/gi).join(""); // extracting unit from maxVal

        checked.unit = unitConfig[this.unitMatch(minVal, unitConfig)].unit;
        return checked;
      }

      if (inputCPU > maxValCPU) {
        checked.number = this.getNumber(maxVal);
        checked.message = "maxVal reached";

        maxVal = maxVal.match(/[a-z]+/gi).join(""); // extracting unit from maxVal
        checked.unit = unitConfig[this.unitMatch(maxVal, unitConfig)].unit;
        return checked;
      }
    }
  }

  convertValuetoCPU(val) {
    const numberRX = /-?[0-9]|\.?/gm;
    const unitRX = /[a-z]+/gi;

    let number = val.match(numberRX).join(""); // extract number
    let unit = val.match(unitRX).join(""); // extract unit

    if (this.unitMatch(unit, this.props.unitConfig) === 1) {
      number = number * 1000;
    }

    return number;
  }
}
