import { HttpStatus } from '@/utils/exceptions/http-status.enum';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import Joi from 'joi';

export type TRequestField = 'body' | 'params' | 'query' | 'headers';
export type TFieldMapping = {
  [key in TRequestField]: TRequestField;
};

/**
 * Validates the incoming request field {@link TRequestField}.
 *
 * Utilizes joi.
 * @param schema - joi schema.
 * @param requestField - request field to validate {@link TRequestField}.
 */
export function validation(schema: Joi.Schema, requestField: TRequestField): RequestHandler {
  const fieldMapping: TFieldMapping = {
    body: 'body',
    params: 'params',
    query: 'query',
    headers: 'headers',
  };

  const validateField = fieldMapping[requestField];
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    };

    const dataToValidate = req[validateField];
    try {
      const value = await schema.validateAsync(dataToValidate, validationOptions);
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

//* validate req.headers from an extended Joi.schema
