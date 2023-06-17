import Joi from 'joi';

const create = Joi.object({
  title: Joi.string().required(),
  body: Joi.string().required(),
});

const modify = Joi.object({
  title: Joi.string(),
  body: Joi.string()
});

export default { create, modify };