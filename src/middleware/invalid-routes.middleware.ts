import { HttpStatus } from '@/utils/exceptions/http-status.enum';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle undefined routes and endpoints.
 */
function handelInvalidRoutes(req: Request, res: Response, next: NextFunction): void {
  res
    .status(HttpStatus.NOT_FOUND)
    .send({ error: 'The requested resource does not exist, please access a valid URL' });
}

export default handelInvalidRoutes;
