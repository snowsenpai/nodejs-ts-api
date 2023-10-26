import { Router } from 'express';
import { validation } from '@/middleware/validation.middleware';
import * as validate from '@/resources/user/user.validation';
import { authenticated } from '@/middleware/authenticated.middleware';
import * as userController from './user.controller';

export const userRouter = Router();

const basePath = '/user';

userRouter.get(basePath, authenticated, userController.getUser);

userRouter.get(
  `${basePath}/:id`,
  validation(validate.findOneUser, 'params'),
  userController.findUser,
);

userRouter.get(
  `${basePath}/:id/posts`,
  validation(validate.findOneUser, 'params'),
  userController.userPost,
);

userRouter.post(
  `${basePath}/register`,
  validation(validate.register, 'body'),
  userController.register,
);

userRouter.patch(
  `${basePath}`,
  validation(validate.updateUser, 'body'),
  authenticated,
  userController.updateUser,
);

userRouter.delete(basePath, authenticated, userController.deleteUser);
