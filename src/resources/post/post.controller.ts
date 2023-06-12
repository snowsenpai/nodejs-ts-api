import { Router, Request, Response, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import HttpException from '@/utils/exceptions/http.exceptions';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/post/post.validation';
import PostService from '@/resources/post/post.service';

class PostController implements Controller {
  public path = '/posts';
  public router = Router();
  private PostService = new PostService();

  constructor() {
    this.initializeRoutes();
  }

  // * /api/posts: GET, POST, DELETE ...
  private initializeRoutes(): void {
    this.router.post(
      `${this.path}`,
      validationMiddleware(validate.create),
      this.create.bind(this)
    );
  }

  private async create (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { title, body } = req.body;

      const post = await this.PostService.create(title, body);

      res.status(201).json({ post });
    } catch (error: any) {
      // error.message will be the error message thrown from the post service
      next(new HttpException(400, error.message));
    }
  };
}

export default PostController;
