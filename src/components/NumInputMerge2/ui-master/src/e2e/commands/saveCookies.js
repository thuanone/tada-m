module.exports.command = function command(cookies) {
  return this
    .getCookies(result => {
      result.value.forEach(cookie => {
        if ((cookie.name.startsWith('com.ibm.cloud.iam.') || cookie.name === 'ace_login_duration') && !cookies.includes(cookie.name)) {
          cookies.push(cookie);
        }
      });
    });
};
