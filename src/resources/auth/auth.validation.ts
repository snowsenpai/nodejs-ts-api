import Joi from "joi";

const login = Joi.object({
  email: Joi.string().required(),

  password: Joi.string().required(),
});

const otpToken = Joi.object({
  token: Joi.string().min(6).required()
});

const recoveryCode = Joi.object({
  code: Joi.string().min(8).required()
});

const resetPassword = Joi.object({
  newPassword: Joi.string().min(6).required()
});

export default { login, otpToken, recoveryCode, resetPassword };