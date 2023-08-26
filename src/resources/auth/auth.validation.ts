import Joi from 'joi';

const login = Joi.object({
  email: Joi.string().email().required(),

  password: Joi.string().required(),
});

const otpToken = Joi.object({
  token: Joi.string().min(6).required(),
});

const recoveryCode = Joi.object({
  code: Joi.string().min(8).required(),
});

const resetPassword = Joi.object({
  newPassword: Joi.string().min(6).required(),
});

const updateEmail = Joi.object({
  newEmail: Joi.string().email().required(),
});

const emailValidation = Joi.object({
  encryptedEmail: Joi.string().hex().required(),
  emailToken: Joi.string().hex().required(),
});

const passwordReset = Joi.object({
  encryptedEmail: Joi.string().hex().required(),
  passwordToken: Joi.string().hex().required(),
});

export default {
  login,
  otpToken,
  recoveryCode,
  resetPassword,
  updateEmail,
  emailValidation,
  passwordReset,
};
