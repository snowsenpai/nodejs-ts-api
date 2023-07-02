import Joi from "joi";

const otpToken = Joi.object({
  token: Joi.string().min(6).required()
});

const recoveryCode = Joi.object({
  code: Joi.string().min(8).required()
})

export default { otpToken, recoveryCode };