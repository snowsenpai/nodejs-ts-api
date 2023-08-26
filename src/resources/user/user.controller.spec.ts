import { Request, Response, NextFunction } from 'express';
import UserController from './user.controller';
import HttpException from '@/utils/exceptions/http.exception';
import User from './user.interface';

describe('User controller .api/user', () => {
  let userController: object;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  // bracket notation to access private methods and properties
  beforeEach(() => {
    userController = UserController;
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    next = jest.fn();
  });

  describe('register', () => {
    // FIX: Controller is no longer a class
    // it('should call UserService register method and return 201', async () => {
    //   const registerSpy = jest.spyOn(userController['UserService'], 'register')
    //   // @ts-ignore
    //   .mockReturnValueOnce('User created');
    //   const name = 'John';
    //   const email = 'test@test.com';
    //   const password = 'password';
    //   req.body = { name, email, password };
    //   await userController['register'](req as Request, res as Response, next);
    //   expect(registerSpy).toHaveBeenCalledWith(name, email, password, 'user');
    //   expect(res.status).toHaveBeenCalledWith(201);
    //   expect(res.json).toHaveBeenCalledWith({ message: 'User created' });
    //   expect(next).not.toHaveBeenCalled();
    // });
    // FIX: Controller is no longer a class
    // it('should call next with HttpException if an error occurs', async () => {
    //   const errorMessage = 'Things exploded';
    //   jest.spyOn(userController['UserService'], 'register')
    //   .mockRejectedValueOnce( new HttpException(400, errorMessage) );
    //   const req = {
    //     body: {
    //       name: '',
    //       email: '',
    //       password: ''
    //     }
    //   }
    //   const next = jest.fn();
    //   await userController['register'](req as Request, res as Response, next);
    //   const [arg] = next.mock.calls[0];
    //   expect(res.status).not.toHaveBeenCalled();
    //   expect(res.json).not.toHaveBeenCalled();
    //   expect(next).toHaveBeenCalledWith(expect.any(HttpException));
    //   expect(arg).toBeInstanceOf(HttpException);
    //   expect(arg.status).toBe(400);
    //   expect(arg.message).toBe(errorMessage);
    // });
  });

  // FIX: login logic moved to auth resource
  // describe('login', () => {
  //   it('should call UserService login method and return 200 with token',async () => {
  //     const loginSpy = jest.spyOn(userController['UserService'], 'login');
  //     const email = 'test@test.com';
  //     const password = 'testing';
  //     const expiresIn = 360;
  //     const token = 'testToken1234';
  //     const accessToken = { expiresIn, token }

  //     req.body = { email, password };
  //     // @ts-ignore
  //     loginSpy.mockResolvedValueOnce(accessToken);

  //     await userController['login'](req as Request, res as Response, next);

  //     expect(loginSpy).toHaveBeenCalledWith(email, password);
  //     expect(res.status).toHaveBeenCalledWith(200);
  //     expect(res.json).toHaveBeenCalledWith({ accessToken: token });
  //     expect(next).not.toHaveBeenCalled();
  //   });

  //   it('should call next with HttpException if an error occurs',async () => {
  //     const errorMessage = 'Somethind went wrong';
  //     jest.spyOn(userController['UserService'], 'login')
  //     .mockRejectedValueOnce(new HttpException(400, errorMessage));

  //     const next = jest.fn();

  //     req.body = {
  //       email: '',
  //       password: ''
  //     };
  //     await userController['login'](req as Request, res as Response, next);

  //     const [arg] = next.mock.calls[0];
  //     expect(res.status).not.toHaveBeenCalled();
  //     expect(res.json).not.toHaveBeenCalled();
  //     expect(next).toHaveBeenCalledWith(expect.any(HttpException));
  //     expect(arg).toBeInstanceOf(HttpException);
  //     expect(arg.status).toBe(400);
  //     expect(arg.message).toBe(errorMessage);
  //   });
  // });

  describe('getUser', () => {
    // FIX: Controller is no longer a class
    // it('should return 200 with user data if user exist in req', () => {
    //   const user = {
    //     _id: 1,
    //     firstName: 'John',
    //     lastName: 'Smith',
    //     email: 'test@gmail.com'
    //   }
    //   const req: Partial<Request> = {
    //     // @ts-ignore
    //     user
    //   }
    //   userController['getUser'](req as Request, res as Response, next)
    //   expect(res.status).toHaveBeenCalledWith(200);
    //   expect(res.send).toHaveBeenCalledWith({ data: user });
    //   expect(next).not.toHaveBeenCalled();
    // });
    // FIX: Controller is no longer a class
    // it('should call next with HttpException is user does not exist in req', () => {
    //   const next = jest.fn();
    //   userController['getUser'](req as Request, res as Response, next);
    //   const [arg] = next.mock.calls[0];
    //   expect(res.status).not.toHaveBeenCalled();
    //   expect(res.send).not.toHaveBeenCalled();
    //   expect(next).toHaveBeenCalledWith(expect.any(HttpException));
    //   expect(arg.status).toBe(404);
    //   expect(arg.message).toBe('No logged in user');
    // });
  });
});
