import authenticatedMiddleware from './authenticated.middleware';
import UserModel from '@/resources/user/user.model';
import token from '@/utils/token.util';
import { HttpStatus, HttpException } from '@/utils/exceptions';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { sampleUser } from 'tests/sample-data';
import { JsonWebTokenError } from 'jsonwebtoken';

const authError = new HttpException(HttpStatus.UNAUTHORIZED, 'You are not authorized');

// TODO refactor tests, dry, try using spyRefrence: jest.Mock and beforeEach

describe('Authentication middleware', () => {
  it('should call next with an HttpException if authorization header is undefined', async () => {
    const req = getMockReq();
    const { res, next } = getMockRes();

    const verifyTokenSpy = jest.spyOn(token, 'verifyToken');
    const findByIdSpy = jest.spyOn(UserModel, 'findById');

    await authenticatedMiddleware(req, res, next);

    expect(verifyTokenSpy).not.toHaveBeenCalled();
    expect(findByIdSpy).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith(authError);
  });

  it('should call next with an HttpException if authorization header does not start with `Bearer `', async () => {
    const req = getMockReq({
      headers: {
        authorization: 'bearer sustoken',
      },
    });
    const { res, next } = getMockRes();
    const verifyTokenSpy = jest.spyOn(token, 'verifyToken');
    const findByIdSpy = jest.spyOn(UserModel, 'findById');

    await authenticatedMiddleware(req, res, next);

    expect(verifyTokenSpy).not.toHaveBeenCalled();
    expect(findByIdSpy).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith(authError);
  });

  it('should call next with an HttpException if authorization header token is invalid', async () => {
    const req = getMockReq({
      headers: {
        authorization: 'Bearer sustoken',
      },
    });
    const { res, next } = getMockRes();
    const verifyTokenSpy = jest
      .spyOn(token, 'verifyToken')
      // @ts-ignore
      .mockImplementation((accessToken) => {
        if (accessToken.includes('accessToken')) return Promise.resolve({ id: sampleUser._id });
        return Promise.reject(new JsonWebTokenError('invalid token'));
      });
    const findByIdSpy = jest.spyOn(UserModel, 'findById');

    await authenticatedMiddleware(req, res, next);

    expect(verifyTokenSpy).toHaveBeenCalledWith('sustoken');
    expect(findByIdSpy).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith(authError);
  });

  it('should call next if a user is not found', async () => {
    const req = getMockReq({
      headers: {
        authorization: 'Bearer accessToken',
      },
    });
    const { res, next } = getMockRes();
    const verifyTokenSpy = jest
      .spyOn(token, 'verifyToken')
      // @ts-ignore
      .mockImplementation((accessToken) => {
        if (accessToken.includes('accessToken')) return Promise.resolve({ id: sampleUser._id });
        return Promise.reject(new JsonWebTokenError('invalid token'));
      });

    // e.g a token with a deleted user id
    const findByIdSpy = jest
      .spyOn(UserModel, 'findById')
      // @ts-ignore
      .mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
    const notFoundError = new HttpException(HttpStatus.NOT_FOUND, 'User not found');

    await authenticatedMiddleware(req, res, next);

    expect(verifyTokenSpy).toHaveBeenCalledWith('accessToken');
    expect(findByIdSpy).toHaveBeenCalledWith(sampleUser._id);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith(notFoundError);
  });

  it('should set the user in the request object and call next if token is valid', async () => {
    const req = getMockReq({
      headers: {
        authorization: 'Bearer accessToken',
      },
    });
    const { res, next } = getMockRes();

    const verifyTokenSpy = jest
      .spyOn(token, 'verifyToken')
      // @ts-ignore
      .mockImplementation((accessToken) => {
        if (accessToken.includes('accessToken')) return Promise.resolve({ id: sampleUser._id });
        return Promise.reject(new JsonWebTokenError('invalid token'));
      });
    const findByIdSpy = jest
      .spyOn(UserModel, 'findById')
      // @ts-ignore
      .mockReturnValue({
        exec: jest.fn().mockResolvedValue(sampleUser),
      });

    await authenticatedMiddleware(req, res, next);

    expect(verifyTokenSpy).toHaveBeenCalledWith('accessToken');
    expect(findByIdSpy).toHaveBeenCalledWith(sampleUser._id);
    expect(req.user).toEqual(sampleUser);
    expect(next).toHaveBeenCalled();
  });
});
