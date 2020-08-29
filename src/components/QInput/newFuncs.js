function convertToBaseUnit(number, unitInUsePTR, unitConfig) {
    while(unitInUsePTR > 0) {
        number = number * unitConfig[unitInUsePTR - 1].convertUpAt;
        unitInUsePTR =- 1;
    }
    return number;
}