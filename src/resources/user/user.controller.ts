import { Router, Response, Request, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import HttpException from '@/utils/exceptions/http.exceptions';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/user/user.validation';
import UserService from './user.service';
import User from './user.interface';
import authenticated from '@/middleware/authenticated.middleware';

class UserController implements Controller{
  public path = '/user';
  public router = Router();
  private UserService = new UserService();

  constructor(){
    this.initialiseRoutes();
  }

  private initialiseRoutes(): void {
    this.router.get(
      this.path,
      authenticated,
      this.getUser
    );

    this.router.get(
      `${this.path}/:id`,
      this.findUser.bind(this)
    );

    this.router.get(
      `${this.path}/:id/posts`,
      this.userPost.bind(this)
    );

    this.router.post(
      `${this.path}/register`,
      validationMiddleware(validate.register),
      this.register.bind(this)
    );

    this.router.post(
      `${this.path}/login`,
      validationMiddleware(validate.login),
      this.login.bind(this)
    );

    this.router.patch(
      `${this.path}`,
      authenticated,
      validationMiddleware(validate.updateUser),
      this.updateUser.bind(this)
    );

    this.router.delete(
      this.path,
      authenticated,
      this.deleteUser.bind(this)
    );
  }

  private async register (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { name, email, password } = req.body;
      const user = await this.UserService.register(
        name,
        email,
        password,
        'user'
      );

      if (user) {
        res.status(201).json({ message: 'User created' });
      }
    } catch (error) {
      if(error instanceof Error){
        next(new HttpException(400, error.message));
      }
    }
  }

  private async login (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { email, password } = req.body;

      const token = await this.UserService.login(email, password);
      res.status(200).json({ access_token: token });
    } catch (error) {
      if(error instanceof Error){
        next(new HttpException(400, error.message));
      }
    }
  }

  private getUser (
    req: Request,
    res: Response,
    next: NextFunction
  ): Response | void {
    if(!req.user) {
      return next(new HttpException(404, 'No logged in user'));
    }

    res.status(200).send({ data: req.user });
  };

  private async findUser(
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

  private async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user?._id;
      const userData: Partial<User> = req.body;
      // if userData.role || password? 401 forbidden
  
      const updatedUser = await this.UserService.updateUser(userId, userData);
      
      res.status(201).json({ updatedUser });
    } catch (error) {
      next(error);
    }
  }

  private async userPost(
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

  private async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user?._id;    
      const response = await this.UserService.deleteUser(userId);
  
      res.status(200).json({ response });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
