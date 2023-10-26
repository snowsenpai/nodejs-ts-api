import { Buffer } from 'node:buffer';
import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto';
import { encode } from 'hi-base32';
import { HttpException, HttpStatus } from './exceptions';
import { logger } from './logger.util';

// ref @types/node: crypto.d.ts
export type BinaryToTextEncoding = 'base64' | 'base64url' | 'hex';
export type CharacterEncoding = 'utf-8';
export type LegacyCharacterEncoding = 'ascii';
export type Encoding = BinaryToTextEncoding | CharacterEncoding | LegacyCharacterEncoding;

/**
 * Generates and returns random alphanumeric characters.
 * @param length - The number of characters to return.
 * @returns string of random alphanumeric characters
 */
function generateRandomString(length: number) {
  const characters = process.env.SECRET_CHARACTERS!;
  const characterCount = characters.length;

  const buf = randomBytes(length);
  let randomString = '';

  for (let i = 0; i < length; i++) {
    // get the octet at position 'i' in the buffer, octet is between 0 and 255
    // `% characterCount` to set range within the length of available characters
    const randomIndex = buf[i] % characterCount;

    // select corresponding character at randomIndex and append to `randomString`
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}

/**
 * Generates random base32 characters.
 * @param size - The number of characters to return.
 * @returns the generated base32 string.
 */
function generateRandomBase32(size: number) {
  const buffer = randomBytes(size);
  const base32 = encode(buffer).substring(0, size);
  return base32;
}

/**
 * Generates and returns an array random alphanumeric characters.
 * @param length - The length of each string
 * @param count - Number of strings to return
 * @returns an array of random alphanumeric characters.
 */
function randomStringArray(length: number, count: number) {
  const randomStrings = [];

  for (let i = 0; i < count; i++) {
    const randomString = generateRandomString(length);
    randomStrings.push(randomString);
  }

  return randomStrings;
}

/**
 * Encodes a string to a given format `outputEncoding`.
 *
 * Utilizes `'node:buffer'`.
 * @param data - The string to encode.
 * @param inputEncoding - The text format of `data` {@link Encoding}.
 * @param outputEncoding - The encoded format to return {@link BinaryToTextEncoding}.
 * @returns The encoded string.
 */
function encodeData(data: string, inputEncoding: Encoding, outputEncoding: BinaryToTextEncoding) {
  const buffer = Buffer.from(data, inputEncoding);
  const encodedData = buffer.toString(outputEncoding);
  return encodedData;
}

/**
 * Decodes a string to a given format `outputEncoding`
 *
 * For correctness, `inputEncoding` must be the same as `outputEncoding`
 * used when encoding.
 *
 * Utilizes `'node:buffer'`.
 * @param data - The string to decode.
 * @param inputEncoding - The text format of `data` {@link BinaryToTextEncoding}.
 * @param outputEncoding - The decoded format to return {@link Encoding}.
 * @returns The decoded string.
 */
function decodeData(data: string, inputEncoding: BinaryToTextEncoding, outputEncoding: Encoding) {
  const buffer = Buffer.from(data, inputEncoding);
  const decodedData = buffer.toString(outputEncoding);
  return decodedData;
}

/**
 * Generates a random string with the specified `outputEncoding`.
 *
 * Utilizes `'node:buffer'`.
 * @param size - Number of characters to return.
 * @param outputEncoding - The format to return {@link BinaryToTextEncoding}.
 * @returns random encoded string.
 */
function randomEncoding(size: number, outputEncoding: BinaryToTextEncoding) {
  const buffer = randomBytes(size);
  const randomEncodedString = buffer.toString(outputEncoding).substring(0, size);
  return randomEncodedString;
}

// normalize strings before passing to crypto apis
const plain_key = process.env.SECRET_KEY!.normalize(); //if no arg, default is 'NFC' (ref: MDN)
const plain_iv = process.env.SECRET_IV!.normalize();
// use node:crypto getCiphers() for array of supported algorithms
const algorithm = 'aes-256-cbc';

// byte sizes of keys depends on the algorithm used, double check node:crypto 'createCipheriv'
const secret_key = createHash('sha512').update(plain_key).digest('hex').substring(0, 32); // 32 bytes secret_key

const secret_iv = createHash('sha512').update(plain_iv).digest('hex').substring(0, 16); // 16 bytes secret_iv

/**
 * Encrypts a string to a given format `outputEncoding`.
 *
 * Utilizes node:crypto `createCipheriv`.
 *
 * @param data - String to encrypt.
 * @param inputEncoding - The string format of data {@link Encoding}.
 * @param outputEncoding - The encrypted format to return {@link Encoding}.
 * @throws * {@link HttpException} if an error occurs.
 *
 * @returns the encrypted string.
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
    throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid data format');
  }
}

/**
 * Decrypts a string to a given format `outputEncoding`.
 *
 * Utilizes node:crypto `createDecipheriv`.
 *
 * given certain scenarios, `inputEncoding` must be the same as `outputEncoding`
 * used when encrypting data.
 * @param data - The string to decrypt.
 * @param inputEncoding - Format of string.
 * @param outputEncoding - The decrypted format to return.
 * @throws * {@link HttpException} if an error occurs.
 *
 * @returns the decrypted string.
 */
function decryptData(data: string, inputEncoding: Encoding, outputEncoding: Encoding) {
  try {
    const decipher = createDecipheriv(algorithm, secret_key, secret_iv);

    let decryptedData = decipher.update(data, inputEncoding, outputEncoding);

    decryptedData += decipher.final(outputEncoding);

    return decryptedData;
  } catch (error) {
    logger.error(error, 'Decryption error');
    throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid data format');
  }
}

//! improve security e.g avoid reuse of secret_keys and ivs (ref: OWASP AO2)
export {
  encryptData,
  decryptData,
  generateRandomString,
  randomStringArray,
  generateRandomBase32,
  encodeData,
  decodeData,
  randomEncoding,
};
