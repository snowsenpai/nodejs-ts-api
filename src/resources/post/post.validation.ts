import Joi from 'joi';

const create = Joi.object({
  title: Joi.string().required(),

  body: Joi.string().required(),
});

// more validation options can be added e.g for udpate post etc

export default { create };