module.exports.command = function command(cookies) {
  return this
    .perform(() => cookies.forEach(c => {
      this.setCookie(c);
    }));
};
