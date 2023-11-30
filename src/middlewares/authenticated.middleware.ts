import { Request, Response, NextFunction } from 'express';
import * as token from '@/utils/token.util';
import { UserModel } from '@/resources/user/user.model';
import { Token } from '@/utils/interfaces/token.interface';
import { HttpException, HttpStatus } from '@/utils/exceptions/index';
import jwt from 'jsonwebtoken';

/**
 * Checks if the incoming request has authorization bearer header.
 */
export async function authenticated(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  const authError = new HttpException(HttpStatus.UNAUTHORIZED, 'You are not authorized');
  try {
    const bearer = req.headers.authorization;

    if (!bearer || !bearer.startsWith('Bearer ')) {
      return next(authError);
    }

    const accessToken = bearer.split('Bearer ')[1].trim();

    const payload: Token | jwt.JsonWebTokenError = await token.verifyToken(accessToken);

    if (payload instanceof jwt.JsonWebTokenError) {
      return next(authError);
    }

    const user = await UserModel.findById(payload.id).exec();

    if (!user) {
      return next(new HttpException(HttpStatus.NOT_FOUND, 'User not found'));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(authError);
  }
}
