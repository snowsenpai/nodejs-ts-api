import Joi from "joi";

const otpToken = Joi.object({
  token: Joi.number().max(6).required()
});

export default { otpToken };