import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto';
import { encode } from 'hi-base32';
import { HttpException, HttpStatus } from './exceptions';
import logger from './logger.util';

// ref @types/node: cypto.d.ts
export type BinaryToTextEncoding = 'base64' | 'base64url' | 'hex';
export type CharacterEncoding = 'utf-8';
export type LegacyCharacterEncoding = 'ascii';
export type Encoding = BinaryToTextEncoding | CharacterEncoding | LegacyCharacterEncoding;

/**
 *
 * @param length - number of characters
 * @returns string of random alphanumeric characters
 */
function generateRandomString(length: number) {
  const characters = process.env.SECRET_CHARACTERS!;
  const characterCount = characters.length;

  const buf = randomBytes(length);
  let randomString = '';

  for (let i = 0; i < length; i++) {
    // get the octect at position 'i' in the buffer using index operator buf[i]
    // range is between 0 and 255
    // randomIndex should be within the range of avalable characters
    const randomIndex = buf[i] % characterCount;

    // select corresponding character at randomindex and append to 'randomString'
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}

/**
 *
 * @param size - number of characters to return
 * @returns
 */
function generateRandomBase32(size: number) {
  const buffer = randomBytes(size);
  const base32 = encode(buffer).substring(0, size);
  return base32;
}

/**
 *
 * @param length the length of each string
 * @param count number of strings to return
 * @returns string[ ]
 */
function randomStringArray(length: number, count: number) {
  const randomStrings = [];

  for (let i = 0; i < count; i++) {
    const randomString = generateRandomString(length);
    randomStrings.push(randomString);
  }
  // ? handle random string uniqueness, cache?...

  return randomStrings;
}

/**
 * `data` argument is a string with a specified `inputEncoding`.
 *
 * The `outputEncoding` specifies the output format of the encoded data,
 * a string using the specified encoding is returned
 * @param data
 * @param inputEncoding
 * @param outputEncoding
 * @returns
 */
function encodeData(data: string, inputEncoding: Encoding, outputEncoding: BinaryToTextEncoding) {
  const buffer = Buffer.from(data, inputEncoding);
  const encodedeData = buffer.toString(outputEncoding);
  return encodedeData;
}

/**
 * `data` argument is a string with a specified `inputEncoding`.
 *
 * The `outputEncoding` specifies the output format of the encoded data,
 * a string using the specified encoding is returned
 *
 * given certain scenarios, `inputEncoding` must be the same as `outputEncoding`
 * used when encoding data
 * @param data
 * @param inputEncoding
 * @param outputEncoding
 * @returns
 */
function decodeData(data: string, inputEncoding: BinaryToTextEncoding, outputEncoding: Encoding) {
  const buffer = Buffer.from(data, inputEncoding);
  const decodedData = buffer.toString(outputEncoding);
  return decodedData;
}

/**
 *
 * @param size number of characters to return
 * @param outputEncoding format of returned string
 * @returns
 */
function randomEndcoding(size: number, outputEncoding: BinaryToTextEncoding) {
  const buffer = randomBytes(size);
  const randomEncodedString = buffer.toString(outputEncoding).substring(0, size);
  return randomEncodedString;
}

// normalize strings before passing to crypto apis
const plain_key = process.env.SECRET_KEY!.normalize(); //if no arg is passed default 'NFC' (ref: MDN)
const plain_iv = process.env.SECRET_IV!.normalize();
// use node:crypto getCiphers() for array of supported algorithms
const algorithm = 'aes-256-cbc';

// byte sizes of keys depends on the algorithm used, double check
const secret_key = createHash('sha512').update(plain_key).digest('hex').substring(0, 32); // 32 bytes secret_key

const secret_iv = createHash('sha512').update(plain_iv).digest('hex').substring(0, 16); // 16 bytes secret_iv

/**
 * `data` argument is a string with a specified `inputEncoding`.
 *
 * The `outputEncoding` specifies the output format of the enciphered data,
 * a string using the specified encoding is returned
 * @param data
 * @param inputEncoding The `encoding` of the data
 * @param outputEncoding the `encoding` of the return value
 */
function encryptData(data: string, inputEncoding: Encoding, outputEncoding: Encoding) {
  try {
    data.normalize();

    const cipher = createCipheriv(algorithm, secret_key, secret_iv);

    let encryptedData = cipher.update(data, inputEncoding, outputEncoding);

    encryptedData += cipher.final(outputEncoding);

    return encryptedData;
  } catch (error) {
    logger.error(error, 'Encryption error');
    throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid data type or format');
  }
}

/**
 * `data` argument is a string with a specified `inputEncoding`.
 *
 * The `outputEncoding` specifies the output format of the enciphered data,
 * a string using the specified encoding is returned
 *
 * given certain scenarios, `inputEncoding` must be the same as `outputEncoding`
 * used when encrypting data
 * @param data
 * @param inputEncoding
 * @param outputEncoding
 */
function decryptData(data: string, inputEncoding: Encoding, outputEncoding: Encoding) {
  try {
    const decipher = createDecipheriv(algorithm, secret_key, secret_iv);

    let decryptedData = decipher.update(data, inputEncoding, outputEncoding);

    decryptedData += decipher.final(outputEncoding);

    return decryptedData;
  } catch (error) {
    logger.error(error, 'Decryption error');
    throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid data type or format');
  }
}

//! imporve security e.g avoid reuse of secret_keys and ivs (ref: OWASP AO2)
export default {
  encryptData,
  decryptData,
  generateRandomString,
  randomStringArray,
  generateRandomBase32,
  encodeData,
  decodeData,
  randomEndcoding,
};
