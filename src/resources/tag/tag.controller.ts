import { Request, Response, NextFunction } from 'express';
import TagService from './tag.service';
import { HttpStatus } from '@/utils/exceptions/http-status.enum';

const tagService = new TagService();

async function create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { name, description } = req.body;

    const data = await tagService.create(name, description);

    res.status(HttpStatus.CREATED).json({
      message: 'tag created successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function getAllTags(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> {
  try {
    const data = await tagService.findAll();

    res.status(HttpStatus.OK).json({
      message: 'available tags retrieved',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  create,
  getAllTags,
};
