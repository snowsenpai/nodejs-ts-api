import { Router } from 'express';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/post/post.validation';
import authenticated from '@/middleware/authenticated.middleware';
import paginationMiddleware from '@/middleware/pagination.middleware';
import postController from './post.controller';

const postRouter = Router();

const basePath = '/posts';

postRouter.get(
  basePath,
  validationMiddleware(validate.postPagination, 'query'),
  paginationMiddleware(postController.postPaginationOptions()),
  postController.getAllPosts,
);

postRouter.get(
  `${basePath}/:id`,
  validationMiddleware(validate.findOnePost, 'params'),
  validationMiddleware(validate.postCreator, 'query'),
  postController.getPostById,
);

postRouter.post(
  basePath,
  validationMiddleware(validate.create, 'body'),
  authenticated,
  postController.create,
);

postRouter.patch(
  `${basePath}/:id`,
  validationMiddleware(validate.findOnePost, 'params'),
  validationMiddleware(validate.modify, 'body'),
  authenticated,
  postController.modifyPost,
);

postRouter.delete(
  `${basePath}/:id`,
  validationMiddleware(validate.findOnePost, 'params'),
  authenticated,
  postController.deletePost,
);

export default postRouter;
