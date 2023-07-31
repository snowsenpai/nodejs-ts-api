import { Router } from 'express';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/post/post.validation';
import authenticated from '@/middleware/authenticated.middleware';
import PostController from './post.controller';

const postController = PostController;
const postRouter = Router();

const basePath = '/posts';

postRouter.get(
  basePath,
  postController.getAllPosts
);

postRouter.get(
  `${basePath}/:id`,
  postController.getPostById
);

postRouter.post(
  basePath,
  authenticated,
  validationMiddleware(validate.create),
  postController.create
);

postRouter.patch(
  `${basePath}/:id`,
  authenticated,
  validationMiddleware(validate.modify),
  postController.modifyPost
);

postRouter.delete(
  `${basePath}/:id`,
  authenticated,
  postController.deletePost
);

export default postRouter;
