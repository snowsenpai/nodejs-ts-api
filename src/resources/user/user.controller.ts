import { Router, Response, Request, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import HttpException from '@/utils/exceptions/http.exceptions';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/user/user.validation';
import UserService from './user.service';
import authenticated from '@/middleware/authenticated.middleware';

class UserController implements Controller{
  public path = '/user';
  public router = Router();
  private UserService = new UserService();

  constructor(){
    this.initialiseRoutes();
  }

  private initialiseRoutes(): void {
    this.router.post(
      `${this.path}/register`,
      validationMiddleware(validate.register),
      this.register
    );

    this.router.post(
      `${this.path}/login`,
      validationMiddleware(validate.login),
      this.login
    );

    this.router.get(
      `${this.path}`,
      authenticated,
      this.getUser
    );
  }

  private async register (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { name, email, password } = req.body;
      // verify registrationResult then use a guard to handle error
      await this.UserService.register(
        name,
        email,
        password,
        'user'
      );

      res.status(201).json({ message: 'User created' });
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
}

export default UserController;
