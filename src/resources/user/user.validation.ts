import Joi from "joi";

const register = Joi.object({
  firstName: Joi.string().max(20).required(),

  lastName: Joi.string().max(20).required(),

  email: Joi.string().email().required(),

  password: Joi.string().min(6).required(),
});

const updateUser = Joi.object({
  firstName: Joi.string().max(20),

  lastName: Joi.string().max(20),
});

const findOneUser = Joi.object({
  id: Joi.string().hex().length(24)
});

export default {
  findOneUser,
  register,
  updateUser,
};
