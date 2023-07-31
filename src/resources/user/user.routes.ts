import { Router } from "express";
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/user/user.validation';
import authenticated from '@/middleware/authenticated.middleware';
import UserController from "./user.controller";

const userController = UserController;
const userRouter = Router();

const basePath = '/user';

userRouter.get(
  basePath,
  authenticated,
  userController.getUser
);

userRouter.get(
  `${basePath}/:id`,
  userController.findUser
);

userRouter.get(
  `${basePath}/:id/posts`,
  userController.userPost
);

userRouter.post(
  `${basePath}/register`,
  validationMiddleware(validate.register),
  userController.register
);

userRouter.patch(
  `${basePath}`,
  authenticated,
  validationMiddleware(validate.updateUser),
  userController.updateUser
);

userRouter.delete(
  basePath,
  authenticated,
  userController.deleteUser
);

export default userRouter;
