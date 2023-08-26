import { Request, Response, NextFunction } from 'express';
import PostController from './post.controller';
import PostService from './post.service';
import HttpException from '@/utils/exceptions/http.exception';

describe('PostController', () => {
  let postController: object;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  const title = 'New post';
  const body = 'test post body';

  const post = {
    _title: title,
    _body: body,
  };

  beforeEach(() => {
    postController = PostController;
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('create', () => {
    // FIX: Controller is no longer a class
    // it('should call PostSercvice create method and return a new post', async () => {
    //   const serviceSpy = jest.spyOn(postController.create)
    //   // @ts-ignore
    //   .mockReturnValueOnce(post);
    //   req.body = {title, body};
    //   await postController['create'](req as Request, res as Response, next);
    //   expect(serviceSpy).toHaveBeenCalledWith(title, body);
    //   expect(res.status).toHaveBeenCalledWith(201);
    //   expect(res.json).toHaveBeenCalledWith({ post });
    //   expect(next).not.toHaveBeenCalled();
    // });
    // FIX: Controller is no longer a class
    // it('should call next with HttpException if an error occors',async () => {
    //   const errorMessage = 'Unable to create post';
    //   jest.spyOn(postController['PostService'], 'create')
    //   .mockRejectedValueOnce(new Error(errorMessage));
    //   req.body = {
    //     title: title,
    //     body: body
    //   }
    //   const next = jest.fn();
    //   await postController['create'](req as Request, res as Response, next);
    //   const [arg] = next.mock.calls[0];
    //   expect(res.status).not.toHaveBeenCalled();
    //   expect(res.json).not.toHaveBeenCalled();
    //   expect(next).toHaveBeenCalledWith(expect.any(HttpException));
    //   expect(arg).toBeInstanceOf(HttpException);
    //   expect(arg.status).toBe(400);
    //   expect(arg.message).toBe(errorMessage);
    // });
  });
});
