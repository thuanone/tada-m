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
  const numLettOrWhiteSpaceDot = /(\s*|\.|[0-9]|[a-z])/gi;
  let report = { message: " ", isValid: true, newPTR: 0 };
  let returnUnitMatch;
  let allArray, wantedArray, matchArray;

  try {
    let allArray = userInput.match(matchAll);
    let wantedArray = userInput.match(numLettOrWhiteSpaceDot);
  } catch {}
  if (userInput === "" || userInput === "-") {
    return report;
  }
  if ((allArray = wantedArray)) {
    let i;
    matchArray = userInput.match(regex);
    if (!isNaN(matchArray[0])) {
      let i;
      do {
        i++;
      } while (!isNaN(matchArray[i]) && i < matchArray);
      returnUnitMatch = this.unitMatch(matchArray[i], units);
      if (!isNaN(returnUnitMatch)) {
        if (matchArray[i + 1] === undefined) {
          return;
        }
      }
    }
    return false;
  }
  report.isValid = false;
  return report;
}
