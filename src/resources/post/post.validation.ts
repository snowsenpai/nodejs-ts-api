import Joi from 'joi';

// TODO validate tags array using custom operator to check for ObjectId?
const create = Joi.object({
  title: Joi.string().required(),
  body: Joi.string().required(),
  tags: Joi.array().items(Joi.string().hex().required().length(24))
});

const modify = Joi.object({
  title: Joi.string(),
  body: Joi.string()
});

export default { create, modify };