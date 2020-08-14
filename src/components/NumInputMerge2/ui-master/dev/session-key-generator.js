const crypt = require('crypto');


const hash = crypt.createHash('sha256');

const rawKey = crypt.randomBytes(1024);

hash.update(rawKey);

console.log(hash.digest('hex').toUpperCase().substr(0, 32));
