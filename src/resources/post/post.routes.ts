import { Router } from 'express';
import { validation } from '@/middleware/validation.middleware';
import * as validate from '@/resources/post/post.validation';
import { authenticated } from '@/middleware/authenticated.middleware';
import { pagination } from '@/middleware/pagination.middleware';
import * as postController from './post.controller';

export const postRouter = Router();

const basePath = '/posts';

postRouter.get(
  basePath,
  validation(validate.postPagination, 'query'),
  pagination(postController.postPaginationOptions),
  postController.getAllPosts,
);

postRouter.get(
  `${basePath}/:id`,
  validation(validate.findOnePost, 'params'),
  validation(validate.postCreator, 'query'),
  postController.getPostById,
);

postRouter.post(
  basePath,
  validation(validate.create, 'body'),
  authenticated,
  postController.create,
);

postRouter.patch(
  `${basePath}/:id`,
  validation(validate.findOnePost, 'params'),
  validation(validate.modify, 'body'),
  authenticated,
  postController.modifyPost,
);

postRouter.delete(
  `${basePath}/:id`,
  validation(validate.findOnePost, 'params'),
  authenticated,
  postController.deletePost,
);
