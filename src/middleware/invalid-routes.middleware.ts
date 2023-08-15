import { Request, Response, NextFunction } from "express";

function handelInvalidRoutes (
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(404).send({error: 'The requested resource does not exist'});
}

export default handelInvalidRoutes;