import jwt from 'jsonwebtoken';
import { Token, TokenData, EncodedData } from './interfaces/token.interface';

/**
 * Creates a signs the given `data` into a  JSON web token.
 *
 * Utilizes jsonwebtoken.
 *
 * @param data - data to sign ({@link EncodedData}).
 * @param duration - signed token's duration in seconds, default duration one day.
 * @returns signed token and token's expiry in seconds.
 */
const createToken = (data: EncodedData, duration?: number): TokenData => {
  const defaultDuration = 60 * 60 * 24; // one day
  const expiresIn = duration || defaultDuration;

  const token = jwt.sign(data, process.env.JWT_SECRET as jwt.Secret, {
    expiresIn,
  });

  return { expiresIn, token };
};

/**
 * Verifies if the given string is a valid jwt string.
 *
 * Utilizes jsonwebtoken.
 * @param token - The string to verify.
 * @throws a jwt error if token is invalid.
 * @returns payload {@link Token}.
 */
const verifyToken = async (token: string): Promise<jwt.VerifyErrors | Token> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET as jwt.Secret, (err, payload) => {
      if (err) return reject(err);

      resolve(payload as Token);
    });
  });
};

export { createToken, verifyToken };
