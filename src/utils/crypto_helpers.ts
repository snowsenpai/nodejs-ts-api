import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
} from 'crypto';

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
 * Encrypt data
 * @param data utf-8 encoded string
 * @returns a hexadecimal string
 */
function encryptData(data: string) {
  data.normalize();

  const cipher = createCipheriv(algorithm, secret_key, secret_iv);

  let encryptedData = cipher.update(data, 'utf-8', 'hex');

  encryptedData += cipher.final('hex');

  return encryptedData;
}

/**
 * 
 * @param data hexadecimal string
 * @returns original utf-8 string
 */
function decryptData(data: string) {
  const decipher = createDecipheriv(algorithm, secret_key, secret_iv);

  let decryptedData = decipher.update(data, 'hex', 'utf-8');

  decryptedData += decipher.final('utf-8');

  return decryptedData;
}

export {
  encryptData, 
  decryptData,
  generateRandomString,
  randomStringArray
}
