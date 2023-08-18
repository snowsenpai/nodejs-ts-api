import { Request, Response, NextFunction } from 'express'
import cryptoHelper from '@/utils/crypto-helpers.util';
import userModel from '@/resources/user/user.model';
import { HttpException, HttpStatus } from '@/utils/exceptions/index';

async function passwordReset(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const basic = (req.headers.passwordToken as string);

    if (!basic || !basic.startsWith('Basic ') ) {
      return next(new HttpException(HttpStatus.UNAUTHORIZED, 'You are not authorized'));
    }

    const base64PasswordToken = basic.split('Basic ')[1].trim();

    const recivedToken = cryptoHelper.decryptData(base64PasswordToken, 'base64', 'utf-8');

    const user = await userModel.findOne({ secretToken: recivedToken });
    //! handle invalid or deleted token  (use a cache for secrets blacklist?)
    if (!user) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid token');
    }

    req.passwordResetSecret = recivedToken;
    return next();
  } catch (error) {
    return next(error);
  }
}

export default passwordReset;