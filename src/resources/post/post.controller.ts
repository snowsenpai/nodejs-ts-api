import { Router, Request, Response, NextFunction } from 'express';
import Controller from '@/utils/interfaces/controller.interface';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from '@/resources/post/post.validation';
import PostService from '@/resources/post/post.service';
import Post from './post.interface';
import authenticated from '@/middleware/authenticated.middleware';

class PostController implements Controller {
  public path = '/posts';
  public router = Router();
  private PostService = new PostService();

  constructor() {
    this.initializeRoutes();
  }

  // * /api/posts: GET, POST, DELETE ...
  private initializeRoutes(): void {
    this.router.get(
      this.path,
      this.getAllPosts.bind(this)
    );

    this.router.get(
      `${this.path}/:id`,
      this.getPostById.bind(this)
    );

    this.router.post(
      this.path,
      authenticated,
      validationMiddleware(validate.create),
      this.create.bind(this)
    );
    
    this.router.patch(
      `${this.path}/:id`,
      authenticated,
      validationMiddleware(validate.modify),
      this.modifyPost.bind(this)
    );

    this.router.delete(
      `${this.path}/:id`,
      authenticated,
      this.deletePost.bind(this)
    );
  }

  private async create (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userId = req.user._id;
      const { title, body } = req.body;

      const post = await this.PostService.create(title, body, userId);

      res.status(201).json({ post });
    } catch (error) {
      next(error);
    }
  };

  public async getAllPosts (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      // pagination logic
      const posts = await this.PostService.findAll();

      res.status(200).json({ posts: posts });
    } catch (error) {
      next(error);
    }
  }

  public async getPostById (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const postId = req.params.id;
      const creator = req.query.creator;

      let post;
      if (creator && creator === 'true') {
        post = await this.PostService.findOne(postId, creator);
      } else {
        post = await this.PostService.findOne(postId);
      }

      res.status(200).json(post);
    } catch (error) {
      next(error);
    }
  }

  private async modifyPost (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const postId = req.params.id;
      const userId = req.user._id;

      const postData: Partial<Post> = req.body;

      const modifiedPost = await this.PostService.modifyPost(postId, postData, userId);

      res.status(201).json({ modifiedPost });
    } catch (error) {
      next(error);
    }
  }

  private async deletePost (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const postId = req.params.id;
      const userId = req.user._id;
  
      const message = await this.PostService.deletePost(postId, userId);
      
      res.status(200).json({ message: message });
    } catch (error) {
      next(error);
    }
  }
}

export default PostController;
