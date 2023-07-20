import { Request, Response, NextFunction } from 'express'
import { decodeBase64 } from '@/utils/crypto_helpers';
import { Unauthorized, BadRequest } from '@/utils/exceptions/clientErrorResponse';

function passwordReset(
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  try {
    const basic = String(req.headers.password_token);

    if (!basic || !basic.startsWith('Basic ') ) {
      return next(new Unauthorized());
    }

    const base64PasswordToken = basic.split('Basic ')[1].trim();

    const passwordToken = decodeBase64(base64PasswordToken);
    const expectedTokenLength = Number(process.env.USER_SECRET_TOKEN_LENGTH)

    if (passwordToken.length !== expectedTokenLength) {
      throw new BadRequest('Invalid credentials');
    }

    req.password_reset_secret = passwordToken;
    return next();
  } catch (error) {
    return next(error);
  }
}

export default passwordReset;