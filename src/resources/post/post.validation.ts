import Joi from 'joi';
import { isValidObjectId } from 'mongoose';

const create = Joi.object({
  title: Joi.string().required(),
  body: Joi.string().required(),
  tags: Joi.array().items(Joi.string().hex().required().length(24)),
});

const modify = Joi.object({
  title: Joi.string(),
  body: Joi.string(),
  tags: Joi.array().items(
    Joi.string().custom((value, helpers) => {
      const filtered = isValidObjectId(value);
      return !filtered ? helpers.error('any.invalid') : value;
    }, 'invalid objectId'),
  ),
});

const findOnePost = Joi.object({
  id: Joi.string().hex().length(24),
});

const postCreator = Joi.object({
  creator: Joi.string().pattern(/^true$/),
});

const postPagination = Joi.object({
  page: Joi.string(),
  limit: Joi.string(),
  search: Joi.string(),
  filter: Joi.string(),
  filterValue: Joi.string(),
});

export { create, findOnePost, modify, postCreator, postPagination };
