
  /**MATCH_TO_ORIGINAL__onClickOnly
   *
   * this functions takes a number, a bool called newUnit and this.state.value called oldvalue
   * and replaces the numerical value of this.state.value with the newnumber and returns a string in the same format as old value
   * e.g. increment --> (1001, false, '1 000 mb') >> returns '1 001 mb'
   * e.g  increment --> (1001, false, '1000mb') >> returns '1001mb'
   * e.g. increment --> (1, true, '1023 mb') >> should return 1 gb
   * -----------------------------
   * @param {Number} newNumber new value for this.state.value
   * @param {Boolean} newUnit bool for if a conversion has happened in increment()/decrement()
   * @param {String} oldValue this.state.value to copy its format
   * @param {Array} parsedOldValueReversed this.state.value matched with a regex and parsed individually into an array
   * @param {Array} parsedNewValueReversed number parsed into individual string ziffer
   * @param {Array} parsedUnit unit of valid this.state.value parsed as a block into an arrray
   * @param {Number} indexOfOldValue counter for matching logic to recreate oldValues format
   * @param {Array} newValueArrayReversed
   * @param {String} newValue new string to replace this.state.value
   * @return {String} newValue
   
  matchToOriginal(newNumber, newUnit, oldValue) {
    if (newUnit) {
      return
    } else {
      //regex
      const numbersAndWhiteSpaceOnly = /-?[0-9]|\s/gi
      const unit = /[a-z]+/gi

      let parsedOldValueReversed = oldValue
        .match(numbersAndWhiteSpaceOnly)
        .reverse()
      let parsedNewValueReversed = `${newNumber}`
        .match(numbersAndWhiteSpaceOnly)
        .reverse()
      let parsedUnit = oldValue.match(unit)
      let indexOfOldValue = 0

      let newValueArrayReversed = []

      for (const x of parsedNewValueReversed) {
        if (parsedOldValueReversed[indexOfOldValue] === ' ') {
          newValueArrayReversed.push(' ')
          indexOfOldValue += 1
          newValueArrayReversed.push(x)
        } else {
          newValueArrayReversed.push(x)
        }
        indexOfOldValue += 1
      }
      let newValue = newValueArrayReversed.reverse().concat(parsedUnit).join('')

      return newValue
    }
  } */