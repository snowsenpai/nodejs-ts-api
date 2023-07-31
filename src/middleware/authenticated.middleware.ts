import { Request, Response, NextFunction } from 'express';
import token from '@/utils/token.util';
import UserModel from '@/resources/user/user.model';
import { Token } from '@/utils/interfaces/token.interface';
import { Unauthorized, NotFound } from '@/utils/exceptions/client-errors.utils';
import jwt  from 'jsonwebtoken';

async function authenticatedMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
  ): Promise<Response | void>  {
  try {
    const bearer = req.headers.authorization;

    if (!bearer || !bearer.startsWith('Bearer ') ) {
      return next(new Unauthorized());
    }

    const accessToken = bearer.split('Bearer ')[1].trim();

    const payload: Token | jwt.JsonWebTokenError = await token.verifyToken(
      accessToken
    );

    if (payload instanceof jwt.JsonWebTokenError) {
      return next(new Unauthorized());
    }

    // no lean queries, posts virtual field
    const user = await UserModel.findById(payload.id).exec();

    if (!user) {
      return next(new NotFound('User not found'));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new Unauthorized());
  }
}

export default authenticatedMiddleware;
