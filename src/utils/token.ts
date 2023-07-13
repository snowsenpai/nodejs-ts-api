import jwt from 'jsonwebtoken';
import { Token, TokenData, EncodedData } from './interfaces/token.interface';

/**
 * @param duration token's duration in seconds, default is one day
 */
export const createToken = (data: EncodedData, duration?: number): TokenData => {
  const defaultDuration = 60 * 60 * 24; // one day
  const expiresIn = duration || defaultDuration;

  const token = jwt.sign(
    data,
    process.env.JWT_SECRET as jwt.Secret, {
    expiresIn,
  });

  return { expiresIn, token };
};

export const verifyToken = async (
  token: string
): Promise<jwt.VerifyErrors | Token> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      process.env.JWT_SECRET as jwt.Secret,
      (err, payload) => {
        if (err) return reject(err);

        resolve(payload as Token);
      }
    );
  });
};

export default { createToken, verifyToken };
