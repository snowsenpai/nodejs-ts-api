import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
} from 'crypto';
import { Encoding } from './types/crypto_helpers.types';
import logger from './logger';

/**
 * 
 * @param length number of characters
 * @returns string of random alphanumeric characters
 */
function generateRandomString(length: number) {
  const characters = process.env.SECRET_CHARACTERS!;
  // number of characters available for selection
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
  // random string uniqueness, cache db?, do-while(generatedStrings.has(generatedString) && generatedSize < count)...

  return randomStrings;
}

// encryption and decryption
// normalize strings before passing to crypto apis
const plain_key = (process.env.SECRET_KEY!).normalize(); //if no arg is passed default 'NFC'
const plain_iv = (process.env.SECRET_IV!).normalize();
const algorithm = 'aes-256-cbc';

// 32 bytes secret_key
const secret_key = createHash('sha512')
  .update(plain_key)
  .digest('hex')
  .substring(0, 32);

// 16 bytes secret_iv
const secret_iv = createHash('sha512')
  .update(plain_iv)
  .digest('hex')
  .substring(0, 16)

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
    throw new Error('Invalid data type or format');
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
    throw new Error('Invalid data type or format');
  }
}

// TODO basic less secure encryption (i.e no algorithm or secret) e.g for sending binary data as bas64

export {
  encryptData, 
  decryptData,
  generateRandomString,
  randomStringArray,
}