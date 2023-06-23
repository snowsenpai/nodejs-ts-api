import Joi from "joi";

const otoGenerate = Joi.object({
  token: Joi.string().required()
});

export default { otoGenerate };