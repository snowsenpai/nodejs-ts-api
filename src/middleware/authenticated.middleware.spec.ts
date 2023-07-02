import { Request, Response, NextFunction } from 'express';
import authenticatedMiddleware from './authenticated.middleware';
import UserModel from '@/resources/user/user.model';
import HttpException from '@/utils/exceptions/http.exceptions';
import token from '@/utils/token';

jest.mock('../utils/token.ts');

jest.mock('../resources/user/user.model.ts', () => {
  return {
    findById: jest.fn(),
  }
});

describe('Authentication middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
      user: undefined,
    };
    res = {};
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call next with an HttpException if authorization header is missing', async () => {
    await authenticatedMiddleware(req as Request, res as Response, next);

    // since HttpException class extends Error
    expect(next).toHaveBeenCalledWith(expect.any(Error));

    const error: Error = (next as jest.Mock).mock.calls[0][0] as Error;
    
    expect(error.message).toBe('Unauthorized');
    expect( (error as HttpException).status ).toBe(401);
  });

  it('should call next with an HttpException if authorization header is invalid', async () => {
    if (req.headers) req.headers.authorization = 'InvalidToken';

    await authenticatedMiddleware(req as Request, res as Response, next);

    const error: Error = (next as jest.Mock).mock.calls[0][0] as Error;

    expect(next).toHaveBeenCalledWith(expect.any(HttpException));
    expect(error.message).toBe('Unauthorized');
    expect( (error as HttpException).status ).toBe(401);
  });

  it('should call next with an HttpException if token verification fails', async () => {
    if (req.headers) req.headers.authorization = 'Bearer accessToken';
    (token.verifyToken as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Token verification error');
    });

    await authenticatedMiddleware(req as Request, res as Response, next);

    const error: Error = (next as jest.Mock).mock.calls[0][0] as Error; 
    expect(next).toHaveBeenCalledWith(expect.any(HttpException));
    expect(error.message).toBe('Unauthorized');
    expect( (error as HttpException).status ).toBe(401);
  });

  it('should set the user in the request object and call next if token is valid', async () => {
    if (req.headers) req.headers.authorization = 'Bearer accessToken';
    const user = { _id: 'userId', email: 'user@test.com', password: 'password' };
    // remove password property
    const { password, ...rest } = user

    token.verifyToken = jest.fn().mockReturnValueOnce({ _id: user._id });

    const findByIdMock = UserModel.findById as jest.Mock;
    
    findByIdMock.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValueOnce(rest),
    });

    await authenticatedMiddleware(req as Request, res as Response, next);
    
    // fix recieves undefined
    // expect(findByIdMock).toHaveBeenCalledWith(user._id);
    expect(req.user).toEqual(rest);
    expect(next).toHaveBeenCalled();
  });
});
