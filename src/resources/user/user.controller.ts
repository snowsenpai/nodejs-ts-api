import { Response, Request, NextFunction } from 'express';
import UserService from './user.service';
import User from './user.interface';
import { HttpStatus } from '@/utils/exceptions/http-status.enum';

const userService = new UserService();

async function register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { firstName, lastName, email, password } = req.body;
    const data = await userService.register(firstName, lastName, email, password);

    res.status(HttpStatus.CREATED).json({
      message: 'user account created successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
}

function getUser(req: Request, res: Response, next: NextFunction): Response | void {
  res.status(HttpStatus.OK).json({
    message: 'user data retrieved',
    data: req.user,
  });
}

async function findUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const userId = req.params.id;

    const data = await userService.findById(userId);

    res.status(HttpStatus.OK).json({
      message: 'user data retrieved',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const userId = req.user?._id;
    // Only fields specified in joi schema will be in the request body,i.e {stripUnknown: true}
    const userData: Partial<User> = req.body;

    const data = await userService.updateUser(userId, userData);

    res.status(HttpStatus.OK).json({
      message: 'user updated successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function userPost(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const userId = req.params.id;

    const data = await userService.getAllPostsOfUser(userId);

    res.status(HttpStatus.OK).json({
      message: 'user post field populated',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const userId = req.user?._id;
    const data = await userService.deleteUser(userId);

    res.status(HttpStatus.OK).json({
      message: 'user account deleted successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  deleteUser,
  findUser,
  getUser,
  register,
  updateUser,
  userPost,
};
