const onClickFunctions = {
//"react-scripts test"
    increment: (number, state, props) => {
        let newNumber;

        if (
            state.unitInUsePTR < props.unitAssociated.length &&
            number < props.conversionToBiggerSize[state.unitInUsePTR] &&
            number + props.unitAssociated[state.unitInUsePTR] >= props.conversionToBiggerSize[state.unitInUsePTR]
        ) {
            newNumber = number % props.conversionToBiggerSize[state.unitInUsePTR];
            return [newNumber, true];
        }//checks if number turns from a nonStandardUpperUnit(<1) to a standardUpperUnit(>=), and will convert if so
        else {
            newNumber = number + props.standardStepSizes[state.unitInUsePTR];
            return [newNumber, false];
        }//if not conversion-ready will simply increment the old value by a standardSized increment

    },
    decrement: (number, state, props) => {
        let newNumber;

        if (
            state.unitInUsePTR < props.unitAssociated.length &&
            number < props.conversionToBiggerSize[state.unitInUsePTR] &&
            number + props.unitAssociated[state.unitInUsePTR] >= props.conversionToBiggerSize[state.unitInUsePTR]
        ) {
            newNumber = number % props.conversionToBiggerSize[state.unitInUsePTR];
            return [newNumber, true];
        }//checks if number turns from a nonStandardUpperUnit(<1) to a standardUpperUnit(>=), and will convert if so
        else {
            newNumber = number + props.standardStepSizes[state.unitInUsePTR];
            return [newNumber, false];
        }//if not conversion-ready will simply increment the old value by a standardSized increment
    },
    getNumber: (valueString) => {
        const numbersOnly = /-?[0-9]|\s/gm;
        let numbersAndWhiteSpaceMatch = valueString.match(numbersOnly);
        //valueString mimics this.state.value

        if (numbersAndWhiteSpaceMatch === null) {
            return 0;
        }
        else {
            let numberArray = [];
            let number;

            for (const e of numbersAndWhiteSpaceMatch) {
                if (e === ' ') {
                    continue;
                } else {
                    numberArray.push(e);
                }
            }
            number = numberArray.join('');
            return Number(number);
        }
    },

    matchToOriginal: (newNumber, newUnit, oldValue) => {
        if (newUnit) {
            return;
        }
        else {
            //regex
            const numbersAndWhiteSpaceOnly = /-?[0-9]|\s/gi;
            const unit = /[a-z]+/gi;

            let parsedOldValueReversed = oldValue.match(numbersAndWhiteSpaceOnly).reverse();
            let parsedNewValueReversed = `${newNumber}`.match(numbersAndWhiteSpaceOnly).reverse();
            let parsedUnit = oldValue.match(unit);
            let indexOfOldValue = 0;

            let newValueArrayReversed = [];

            for (const x of parsedNewValueReversed) {
                if (parsedOldValueReversed[indexOfOldValue] === ' ') {
                    newValueArrayReversed.push(' ');
                    indexOfOldValue += 1;
                    newValueArrayReversed.push(x);
                } else {
                    newValueArrayReversed.push(x);
                }
                indexOfOldValue += 1;
            }
            let newValue = newValueArrayReversed.reverse().concat(parsedUnit).join('');

            return newValue;
        }
    }

}
module.exports = onClickFunctions