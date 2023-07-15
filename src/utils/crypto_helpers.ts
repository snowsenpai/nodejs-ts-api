import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
} from 'crypto';

const plain_key = (process.env.SECRET_KEY!).normalize('NFC');
const plain_iv = (process.env.SECRET_IV!).normalize('NFC');
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

function encryptData(data: string) {
  data.normalize('NFC');

  const cipher = createCipheriv(algorithm, secret_key, secret_iv);

  let encryptedData = cipher.update(data, 'utf-8', 'hex');

  encryptedData += cipher.final('hex');

  return encryptedData;
}

function decryptData(data: string) {
  const decipher = createDecipheriv(algorithm, secret_key, secret_iv);

  let decryptedData = decipher.update(data, 'hex', 'utf-8');

  decryptedData += decipher.final('utf-8');

  return decryptedData;
}

export {
  encryptData, 
  decryptData
}
