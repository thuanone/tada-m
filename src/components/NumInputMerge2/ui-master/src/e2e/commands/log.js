module.exports.command = function command(msg) {
  return this.perform(() => console.log(' .', msg));
};
