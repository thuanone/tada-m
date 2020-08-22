function validate(userInput, units) {
  const matchAll = /./gm;
  const regex = /([0-9]*\.?[0-9]*)\s*([a-z]+)?/gi;
  const numLettOrWhiteSpaceDot = /(\s*|\.|[0-9]|[a-z])/gi;
  let report = { message: " ", isValid: true, newPTR: 0 };
  let returnUnitMatch;
  let allArray, wantedArray, matchArray;

  try {
    let allArray = userInput.match(matchAll);
    let wantedArray = userInput.match(numLettOrWhiteSpaceDot);
  } catch {}
  if (allArray.length > wantedArray.length) {
    report.message = "invalid char";
    report.isValid = false;
    return report;
  }
  matchArray = userInput.match(regex);
  if (isNaN(matchArray[0])) {
    report.message = "enter number first";
    report.isValid = false;
    return report;
  }
  let i = 1;
  if (matchArray[i + 1] === undefined) {
    return report;
  } else {
    do {
      i++;
    } while (matchArray[i] === "");
  }
  if (matchArray[i] !== "" && isNaN(matchArray[i])) {
    returnUnitMatch = this.unitMatch(matchArray[i], units);
    if (returnUnitMatch === "isInvalid") {
      report.message = "please specify correct unit";
      report.isValid = false;
      return report;
    } else {
      report.newPTR = returnUnitMatch;
    }
  }
  if (matchArray[i + 1] !== undefined) {
    report.message = "please format [Number][unit]";
    report.isValid = false;
    return report;
  }
  return report;
}

function validateWhiteList(userInput, units) {
  const matchAll = /./gm;
  const regex = /([0-9]*\.?[0-9]*)\s*([a-z]+)?/gi;
  const numLettOrWhiteSpaceDot = /(\s|\.|[0-9]|[a-z])/gi;
  let report = { message: " ", isValid: true, newPTR: 0 };
  let returnUnitMatch;
  let allCharactersToArray, wantedArray, matchArray;

  try {
    let allCharcatersToArray = userInput.match(matchAll);
    let wantedArray = userInput.match(numLettOrWhiteSpaceDot);
  } catch {
    report.isValid = false;
    report.message = "passed null/undefined into validate";
    return report;
  }

  if (userInput === "" || userInput === "-") {
    return report;
  }
  if ((allCharactersToArray.length = wantedArray.length)) {
    let i = 0;
    matchArray = userInput.match(regex);
    if (!isNaN(matchArray[0])) {
      do {
        i++;
      } while (!isNaN(matchArray[i]) && i < matchArray.length);
      returnUnitMatch = this.unitMatch(matchArray[i], units);
      if (!isNaN(returnUnitMatch)) {
        if (matchArray[i + 1] === undefined) {
          report.newPTR = returnUnitMatch;
          return report;
        }
        report.isValid = false;
        report.message = "this input field only accepts this format: [Number] [Unit] ";
        return report;
      }
      report.isValid = false;
      report.message = "unit used is not a valid unit";
      return report;
    }
    report.isValid = false;
    report.message = "please input number first";
    return false;
  }
  report.isValid = false;
  report.message = "invalid characters used";
  return report;
}
