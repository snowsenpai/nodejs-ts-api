import { Request, Response, NextFunction } from 'express';
import token from '@/utils/token.util';
import UserModel from '@/resources/user/user.model';
import { Token } from '@/utils/interfaces/token.interface';
import { HttpException, HttpStatus } from '@/utils/exceptions/index';
import jwt  from 'jsonwebtoken';

async function authenticatedMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
  ): Promise<Response | void>  {
    const errorMessage = 'You are not authorized';
    try {
    const bearer = req.headers.authorization;

    if (!bearer || !bearer.startsWith('Bearer ') ) {
      return next(new HttpException(HttpStatus.UNAUTHORIZED, errorMessage));
    }

    const accessToken = bearer.split('Bearer ')[1].trim();

    const payload: Token | jwt.JsonWebTokenError = await token.verifyToken(
      accessToken
    );

    if (payload instanceof jwt.JsonWebTokenError) {
      return next(new HttpException(HttpStatus.UNAUTHORIZED, errorMessage));
    }

    const user = await UserModel.findById(payload.id).exec();

    if (!user) {
      return next(new HttpException(HttpStatus.NOT_FOUND,'User not found'));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new HttpException(HttpStatus.UNAUTHORIZED, errorMessage));
  }
}

export default authenticatedMiddleware;
