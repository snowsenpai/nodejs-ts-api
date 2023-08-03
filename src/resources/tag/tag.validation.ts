import Joi from "joi";

const create = Joi.object({
  name: Joi.string().required().max(12),
  description: Joi.string().required().max(120)
});

export default { create };