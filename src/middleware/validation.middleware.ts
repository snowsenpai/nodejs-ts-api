import { HttpStatus } from '@/utils/exceptions/http-status.enum';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import Joi from 'joi';

type TRequestField = 'body' | 'params' | 'query' | 'headers';
type TFieldMapping = {
  [key in TRequestField]: TRequestField;
};

function validationMiddleware(schema: Joi.Schema, requestField: TRequestField): RequestHandler {
  const fieldMapping: TFieldMapping = {
    body: 'body',
    params: 'params',
    query: 'query',
    headers: 'headers'
  }

  const validateField = fieldMapping[requestField];
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    };

    const dataToValidate = req[validateField];
    try {
      const value = await schema.validateAsync(
        dataToValidate,
        validationOptions
      );
      req[validateField] = value;
      next();
    } catch (e: any) {
      const errors: string[] = [];
      e.details.forEach((error: Joi.ValidationErrorItem) => {
        errors.push(error.message);
      });
      res.status(HttpStatus.BAD_REQUEST).send({ errors: errors });
    }
  };
}

export default validationMiddleware;
//! imporvements:
//* validating req.headers modify fn to accept a 3rd boolean arg default to true to handle {stripUnknown: true,}
// when validating headers pass a 3rd arg of flase (just for headers)
//* custom validation messages e.g in cases where regex() is used
//* tightly couple validation schema property name with fields names defined(expected) for req params, body, query
// and headers. a global map to prevent validationMiddleware from removing undefined(but needed) fields in the
// respective req property (a sort of app level validator)
//** as well as the specific validation values e.g creator: 'true' in req.query, pick a suitable data structure
// that can accomplish the task
//! move 'improvements'comments to '/docs/improvements.html' with general (#code #api) and specific (#validation) tags