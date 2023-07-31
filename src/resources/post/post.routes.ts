import { Router } from 'express';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/post/post.validation';
import authenticated from '@/middleware/authenticated.middleware';
import PostController from './post.controller';

const postController = new PostController();
const postRouter = Router();

const basePath = '/posts';

postRouter.get(
  basePath,
  postController.getAllPosts.bind(postController)
);

postRouter.get(
  `${basePath}/:id`,
  postController.getPostById.bind(postController)
);

postRouter.post(
  basePath,
  authenticated,
  validationMiddleware(validate.create),
  postController.create.bind(postController)
);

postRouter.patch(
  `${basePath}/:id`,
  authenticated,
  validationMiddleware(validate.modify),
  postController.modifyPost.bind(postController)
);

postRouter.delete(
  `${basePath}/:id`,
  authenticated,
  postController.deletePost.bind(postController)
);

export default postRouter;
