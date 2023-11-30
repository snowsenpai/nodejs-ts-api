import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Generates a URL string by parsing information from the request object.
 * @param queryParams - Includes request's query parameter in the parsed url.
 */
export function getFullUrl(queryParams = true): RequestHandler {
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
//! improvements
//* validate req.headers.host ('host:port') to prevent host header attacks
