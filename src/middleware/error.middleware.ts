import { Request, Response, NextFunction } from 'express';
import HttpException from '@/utils/exceptions/http.exceptions';
import logger from '@/utils/logger';

function errorMiddleware(
  error: HttpException,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(error, 'an error occured');
  const status = error.status || 500;
  const message = error.message || 'Something went wrong';
  res.status(status).send({
    status,
    message,
  });
}

export default errorMiddleware;
