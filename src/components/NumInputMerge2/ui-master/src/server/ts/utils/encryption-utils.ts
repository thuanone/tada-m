import * as loggerUtil from '@console/console-platform-log4js-utils';
const logger = loggerUtil.getLogger('clg-ui:utils-encryption');

import * as crypto from 'crypto';
import * as nconf from 'nconf';

const ENCRYPTION_KEY = nconf.get('coligoEncryptionKey') || 'coligo-default';
const ENCRYPTION_ALGORITHM = nconf.get('coligoEncryptionAlgorithm') || 'aes-256-cbc';
const ENCRYPTION_IV = nconf.get('coligoEncryptionIV') || 'ReplaceMeWithSomeBetterValue';

function prepareCipherKey(rawKey, encoding?) {
  const key = Buffer.alloc(32); // key should be 32 bytes
  const strKey = Buffer.from(rawKey, encoding || 'utf8');
  strKey.copy(key, 0, 0, 31);
  return key;
}

function prepareCipherIV(rawIV, encoding?) {
  const iv = Buffer.alloc(16); // iv needs to be 16 bytes in length for aes-256-cbc
  const strIv = Buffer.from(rawIV, encoding || 'utf8');
  strIv.copy(iv, 0, 0, 15);
  return iv;
}

/**
 * Encrypts the given string using the AES as an encryption method including a configured salt.
 *
 * @param {string} text - the text that should be encrypted
 */
export function encrypt(text) {
  const fn = 'encrypt ';
  try {
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, prepareCipherKey(ENCRYPTION_KEY), prepareCipherIV(ENCRYPTION_IV));
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
  } catch (e) {
    logger.error(`${fn}- Failed to encrypt a given string object`, e);
  }
  return null;
}
/**
 * Encrypts the given json object using AES encryption method including a configured salt.
 *
 * @param {JSON} jsonObj  - the JSON object that should be encrypted
 */
export function encryptJson(jsonObj) {
  const fn = 'encryptJson ';

  try {
    const text = JSON.stringify(jsonObj);
    return encrypt(text);
  } catch (e) {
    logger.error(`${fn}- Failed to encrypt a given JSON object`, e);
  }
  return null;
}

/**
 * Decrypts the given text using AES as a decryption method.
 *
 * @param {String} encryptedText - the text that shouö dbe decrypted
 */
export function decrypt(encryptedText) {
  const fn = 'decrypt ';

  try {
    const encrypted = Buffer.from(encryptedText, 'hex');
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, prepareCipherKey(ENCRYPTION_KEY), prepareCipherIV(ENCRYPTION_IV));
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    logger.error(`${fn}- Failed to decrypt a given text to a string`, e);
  }
  return null;
}

/**
 * Decrypts the given text using AES as a decryption method and parses the decrypted string to a JSON object
 *
 * @param {String} encryptedText
 */
export function decryptJson(encryptedText) {
  const fn = 'decryptJson ';

  let decryptedText;
  try {
    decryptedText = decrypt(encryptedText);
    return JSON.parse(decryptedText);
  } catch (e) {
    logger.warn(`${fn}- type: '${typeof decryptedText}', text: '${decryptedText}' `);
    logger.error(`${fn}- Failed to decrypt a given text to a JSON object`, e);
  }
  return null;
}
