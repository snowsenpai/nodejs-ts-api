import { Router } from 'express';
import { validation } from '@/middlewares/validation.middleware';
import * as validate from './tag.validation';
import * as tagController from './tag.controller';

export const tagRouter = Router();
const basePath = '/tags';

tagRouter.get(basePath, tagController.getAllTags);

// roleAuth: admins manage available tags, users can request for new tag(s)
tagRouter.post(basePath, validation(validate.create, 'body'), tagController.create);
