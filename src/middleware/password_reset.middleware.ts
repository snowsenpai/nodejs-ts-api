import { Request, Response, NextFunction } from 'express'
import { decryptData } from '@/utils/crypto_helpers';
import userModel from '@/resources/user/user.model';
import { Unauthorized, BadRequest, Forbidden } from '@/utils/exceptions/clientErrorResponse';

async function passwordReset(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const basic = String(req.headers.password_token);

    if (!basic || !basic.startsWith('Basic ') ) {
      return next(new Unauthorized());
    }

    const base64PasswordToken = basic.split('Basic ')[1].trim();

    const recivedToken = decryptData(base64PasswordToken, 'base64', 'utf-8');

    const user = await userModel.findOne({ secret_token: recivedToken });
    // token is invalid, or deleted (v2: use a cache for secrets blacklist or refresh encryption key and iv?)
    if (!user) {
      throw new BadRequest('Invalid token');
    }

    req.password_reset_secret = recivedToken;
    return next();
  } catch (error) {
    return next(error);
  }
}

export default passwordReset;