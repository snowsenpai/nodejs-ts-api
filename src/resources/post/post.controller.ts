import { Request, Response, NextFunction } from 'express';
import PostService from '@/resources/post/post.service';
import Post from './post.interface';

class PostController {
  private PostService = new PostService();

  public async create (
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

  public async modifyPost (
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

  public async deletePost (
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
