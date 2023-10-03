import authenticatedMiddleware from './authenticated.middleware';
import UserModel from '@/resources/user/user.model';
import token from '@/utils/token.util';
import { HttpStatus, HttpException } from '@/utils/exceptions';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { sampleUser } from 'tests/sample-data';
import { JsonWebTokenError } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const authError = new HttpException(HttpStatus.UNAUTHORIZED, 'You are not authorized');

describe('Authentication middleware', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;
  let verifyTokenSpy: jest.SpyInstance;
  let findByIdSpy: jest.SpyInstance;

  beforeEach(() => {
    req = getMockReq();
    ({ res, next } = getMockRes());

    verifyTokenSpy = jest
      .spyOn(token, 'verifyToken')
      // @ts-ignore
      .mockImplementation((accessToken) => {
        if (accessToken.includes('accessToken')) return Promise.resolve({ id: sampleUser._id });
        return Promise.reject(new JsonWebTokenError('invalid token'));
      });

    findByIdSpy = jest
      .spyOn(UserModel, 'findById')
      // @ts-ignore
      .mockReturnValue({
        exec: jest.fn().mockResolvedValue(sampleUser),
      });
  });

  it('should call next with an HttpException if authorization header is undefined', async () => {
    await authenticatedMiddleware(req, res, next);

    expect(verifyTokenSpy).not.toHaveBeenCalled();
    expect(findByIdSpy).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith(authError);
  });

  it('should call next with an HttpException if authorization header does not start with `Bearer `', async () => {
    req.headers.authorization = 'bearer sustoken';

    await authenticatedMiddleware(req, res, next);

    expect(verifyTokenSpy).not.toHaveBeenCalled();
    expect(findByIdSpy).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith(authError);
  });

  it('should call next with an HttpException if authorization header token is invalid', async () => {
    req.headers.authorization = 'Bearer sustoken';

    await authenticatedMiddleware(req, res, next);

    expect(verifyTokenSpy).toHaveBeenCalledWith('sustoken');
    expect(findByIdSpy).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith(authError);
  });

  it('should call next if a user is not found', async () => {
    req.headers.authorization = 'Bearer accessToken';

    // e.g a token with a deleted user id
    findByIdSpy.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await authenticatedMiddleware(req, res, next);

    expect(verifyTokenSpy).toHaveBeenCalledWith('accessToken');
    expect(findByIdSpy).toHaveBeenCalledWith(sampleUser._id);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith(new HttpException(HttpStatus.NOT_FOUND, 'User not found'));
  });

  it('should set the user in the request object and call next if token is valid', async () => {
    req.headers.authorization = 'Bearer accessToken';

    await authenticatedMiddleware(req, res, next);

    expect(verifyTokenSpy).toHaveBeenCalledWith('accessToken');
    expect(findByIdSpy).toHaveBeenCalledWith(sampleUser._id);
    expect(req.user).toEqual(sampleUser);
    expect(next).toHaveBeenCalled();
  });
});
