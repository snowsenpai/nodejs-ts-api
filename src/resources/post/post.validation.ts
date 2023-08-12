import Joi from 'joi';
import { isValidObjectId } from 'mongoose';

const create = Joi.object({
  title: Joi.string().required(),
  body: Joi.string().required(),
  tags: Joi.array().items(Joi.string().hex().required().length(24))
});

const modify = Joi.object({
  title: Joi.string(),
  body: Joi.string(),
  tags: Joi.array().items(Joi.string().custom((value, helpers) => {
      const filtered = isValidObjectId(value);
      return !filtered ? helpers.error('any.invalid') : value;
    }, 'invalid objectId')
  )
});

export default { create, modify };