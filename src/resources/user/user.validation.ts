import Joi from "joi";

const register = Joi.object({
  name: Joi.string().max(20).required(),

  email: Joi.string().email().required(),

  password: Joi.string().min(6).required(),
});

const updateUser = Joi.object({
  name: Joi.string().max(20),

  email: Joi.string().email(),
});

export default { register, updateUser };
