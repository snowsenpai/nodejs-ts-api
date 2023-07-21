import { Request, Response, NextFunction } from 'express';
import HttpException from '@/utils/exceptions/http.exceptions';
import logger from '@/utils/logger';

function errorMiddleware(
  error: HttpException,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const status = error.status || 500;
  let message = error.message;
  if (status === 500) {
    // TODO if 500, email an admin
    // add public admin email or support email to message or frontend handles that?
    message = 'Something went wrong';
    logger.error(error);
  }

  res.status(status).send({
    status,
    message,
  });
}

export default errorMiddleware;
