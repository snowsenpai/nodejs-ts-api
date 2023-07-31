import { Request, Response, NextFunction } from 'express'
import cryptoHelper from '@/utils/crypto-helpers.util';
import userModel from '@/resources/user/user.model';
import { Unauthorized, BadRequest } from '@/utils/exceptions/client-errors.utils';

async function passwordReset(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const basic = String(req.headers.passwordToken);

    if (!basic || !basic.startsWith('Basic ') ) {
      return next(new Unauthorized());
    }

    const base64PasswordToken = basic.split('Basic ')[1].trim();

    const recivedToken = cryptoHelper.decryptData(base64PasswordToken, 'base64', 'utf-8');

    const user = await userModel.findOne({ secretToken: recivedToken });
    // token is invalid, or deleted (v2: use a cache for secrets blacklist or refresh encryption key and iv?)
    if (!user) {
      throw new BadRequest('Invalid token');
    }

    req.passwordResetSecret = recivedToken;
    return next();
  } catch (error) {
    return next(error);
  }
}

export default passwordReset;