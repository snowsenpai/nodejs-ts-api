import { Request, Response, NextFunction } from 'express';
import * as cryptoUtil from '@/utils/crypto.util';
import { UserModel } from '@/resources/user/user.model';
import { HttpException, HttpStatus } from '@/utils/exceptions/index';

/**
 * Checks if the incoming request has a `passwordtoken` basic header.
 */
export async function passwordReset(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const basic = req.headers.passwordtoken as string;

    if (!basic || !basic.startsWith('Basic ')) {
      return next(new HttpException(HttpStatus.UNAUTHORIZED, 'You are not authorized'));
    }

    const base64PasswordToken = basic.split('Basic ')[1].trim();

    const receivedToken = cryptoUtil.decryptData(base64PasswordToken, 'base64', 'utf-8');

    const user = await UserModel.findOne({ secretToken: receivedToken });
    //! handle invalid or deleted token  (use a cache for secrets blacklist?)
    if (!user) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid token');
    }

    req.passwordResetSecret = receivedToken;
    return next();
  } catch (error) {
    return next(error);
  }
}
