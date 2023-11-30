import { Request, Response, NextFunction } from 'express';
import { PostService } from '@/resources/post/post.service';
import { Post } from './post.interface';
import { HttpStatus } from '@/utils/exceptions/http-status.enum';

const postService = new PostService();

async function create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const userId = req.user?._id;
    const { title, body, tags } = req.body;

    const data = await postService.create(title, body, userId, tags);

    res.status(HttpStatus.CREATED).json({
      message: 'post created successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function postPaginationOptions() {
  const paginationOptions = await postService.paginationOptions();
  return paginationOptions;
}

async function getAllPosts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const paginationDetails = req.paginationDetails!;
    const data = await postService.findAll(paginationDetails);

    res.status(HttpStatus.OK).json({
      message: 'all available posts retrieved',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function getPostById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const postId = req.params.id;
    const creator = req.query.creator;

    let data;
    if (creator && creator === 'true') {
      data = await postService.findOne(postId, creator);
    } else {
      data = await postService.findOne(postId);
    }

    res.status(HttpStatus.OK).json({
      message: 'post retrieved',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function modifyPost(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const postId = req.params.id;
    const userId = req.user?._id;

    const postData: Partial<Post> = req.body;

    const data = await postService.modifyPost(postId, postData, userId);

    res.status(HttpStatus.OK).json({
      message: 'post updated successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function deletePost(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const postId = req.params.id;
    const userId = req.user?._id;

    const data = await postService.deletePost(postId, userId);

    res.status(HttpStatus.OK).json({
      message: 'post deleted successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export { create, deletePost, getAllPosts, getPostById, modifyPost, postPaginationOptions };
