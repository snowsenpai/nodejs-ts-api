import { Router } from 'express';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/user/user.validation';
import authenticated from '@/middleware/authenticated.middleware';
import userController from './user.controller';

const userRouter = Router();

const basePath = '/user';

userRouter.get(basePath, authenticated, userController.getUser);

userRouter.get(
  `${basePath}/:id`,
  validationMiddleware(validate.findOneUser, 'params'),
  userController.findUser,
);

userRouter.get(
  `${basePath}/:id/posts`,
  validationMiddleware(validate.findOneUser, 'params'),
  userController.userPost,
);

userRouter.post(
  `${basePath}/register`,
  validationMiddleware(validate.register, 'body'),
  userController.register,
);

userRouter.patch(
  `${basePath}`,
  validationMiddleware(validate.updateUser, 'body'),
  authenticated,
  userController.updateUser,
);

userRouter.delete(basePath, authenticated, userController.deleteUser);

export default userRouter;
