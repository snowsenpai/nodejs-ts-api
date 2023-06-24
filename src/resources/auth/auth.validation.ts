import Joi from "joi";

const otpToken = Joi.object({
  token: Joi.string().max(6).required()
});

export default { otpToken };