import { Response, Request, NextFunction } from 'express';
import UserService from './user.service';
import User from './user.interface';
import { NotFound } from '@/utils/exceptions/client_error';

class UserController {
  private UserService = new UserService();

  public async register (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { firstName, lastName, email, password } = req.body;
      const message = await this.UserService.register(
        firstName,
        lastName,
        email,
        password,
      );

      res.status(201).json(message);
      
    } catch (error) {
      next(error);
    }
  }

  public getUser (
    req: Request,
    res: Response,
    next: NextFunction
  ): Response | void {
    if(!req.user) {
      return next(new NotFound('No logged in user'));
    }
    const user = req.user;
    res.status(200).json(user);
  };

  public async findUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.params.id;
  
      const user = await this.UserService.findById(userId);
  
      res.status(200).json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  public async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user._id;
      // Only fields specified in joi schema will be in the request body,i.e {stripUnknown: true}
      const userData: Partial<User> = req.body;
  
      const updatedUser = await this.UserService.updateUser(userId, userData);

      res.status(201).json({ updatedUser });
    } catch (error) {
      next(error);
    }
  }

  public async userPost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.params.id;
  
      const posts = await this.UserService.getAllPostsOfUser(userId);
  
      res.status(200).json({ posts: posts });
    } catch (error) {
      next(error);
    }
  }

  public async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user._id;    
      const response = await this.UserService.deleteUser(userId);
  
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
