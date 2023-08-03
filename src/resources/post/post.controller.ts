import { Request, Response, NextFunction } from 'express';
import PostService from '@/resources/post/post.service';
import Post from './post.interface';

const postService = new PostService();

async function create (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const userId = req.user._id;
    const { title, body, tags } = req.body;

    const post = await postService.create(title, body, userId, tags);

    res.status(201).json({ post });
  } catch (error) {
    next(error);
  }
};

async function getAllPosts (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    // pagination logic
    const posts = await postService.findAll();

    res.status(200).json({ posts: posts });
  } catch (error) {
    next(error);
  }
}

async function getPostById (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const postId = req.params.id;
    const creator = req.query.creator;

    let post;
    if (creator && creator === 'true') {
      post = await postService.findOne(postId, creator);
    } else {
      post = await postService.findOne(postId);
    }

    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
}

async function modifyPost (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const postData: Partial<Post> = req.body;

    const modifiedPost = await postService.modifyPost(postId, postData, userId);

    res.status(201).json({ modifiedPost });
  } catch (error) {
    next(error);
  }
}

async function deletePost (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const message = await postService.deletePost(postId, userId);
    
    res.status(200).json({ message: message });
  } catch (error) {
    next(error);
  }
}

export default {
  create,
  deletePost,
  getAllPosts,
  getPostById,
  modifyPost,
};
