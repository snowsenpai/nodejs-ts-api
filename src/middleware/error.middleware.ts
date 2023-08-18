import { Request, Response, NextFunction } from 'express';
import HttpException from '@/utils/exceptions/http.exception';
import { HttpStatus } from '@/utils/exceptions/http-status.enum';
import logger from '@/utils/logger.util';

function errorMiddleware(
  error: HttpException,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
  let message = error.message;
  if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
    message = 'Something went wrong, please reach out to an admin';
    logger.error(error);
  }

  res.status(status).send({
    status,
    message,
  });
}

export default errorMiddleware;
