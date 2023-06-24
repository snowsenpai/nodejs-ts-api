import Joi from "joi";

const otpToken = Joi.object({
  token: Joi.string().min(6).required()
});

export default { otpToken };