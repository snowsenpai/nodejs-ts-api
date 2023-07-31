import { Request, Response, NextFunction } from 'express';
import HttpException from '@/utils/exceptions/http.exception';
import logger from '@/utils/logger.util';

function errorMiddleware(
  error: HttpException,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const status = error.status || 500;
  let message = error.message;
  if (status === 500) {
    message = 'Something went wrong';
    logger.error(error);
  }

  res.status(status).send({
    status,
    message,
  });
}

export default errorMiddleware;
