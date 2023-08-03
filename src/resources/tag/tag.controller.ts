import { Request, Response, NextFunction } from 'express';
import TagService from './tag.service';
import Tag from './tag.interface';

const tagService = new TagService();

async function create (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const { name, description } = req.body;

    const tag = await tagService.create(name, description);

    res.status(201).json(tag);
  } catch (error) {
    next(error);
  }
}

async function getAllTags (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const tags = await tagService.findAll();
    res.status(200).json(tags);
  } catch (error) {
    next(error);
  }
}

export default {
  create,
  getAllTags,
}