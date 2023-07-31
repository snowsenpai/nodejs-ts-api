import { Router } from "express";
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/user/user.validation';
import authenticated from '@/middleware/authenticated.middleware';
import UserController from "./user.controller";

const userController = new UserController();
const userRouter = Router();

const basePath = '/user';

userRouter.get(
  basePath,
  authenticated,
  userController.getUser
);

userRouter.get(
  `${basePath}/:id`,
  userController.findUser.bind(userController)
);

userRouter.get(
  `${basePath}/:id/posts`,
  userController.userPost.bind(userController)
);

userRouter.post(
  `${basePath}/register`,
  validationMiddleware(validate.register),
  userController.register.bind(userController)
);

userRouter.patch(
  `${basePath}`,
  authenticated,
  validationMiddleware(validate.updateUser),
  userController.updateUser.bind(userController)
);

userRouter.delete(
  basePath,
  authenticated,
  userController.deleteUser.bind(userController)
);

export default userRouter
