import { Request, Response, NextFunction, RequestHandler } from 'express';

function getFullUrl(queryParams = true): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { protocol, originalUrl } = req;
      const headersHost = req.headers.host;
      const requestedUrl = queryParams ? originalUrl : originalUrl.split('?')[0];

      const fullUrl = `${protocol}://${headersHost}${requestedUrl}`;
      req.completeUrl = fullUrl;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default getFullUrl;
//! improvements
//* validate req.headers.host ('host:port') to prevent host header attacks
