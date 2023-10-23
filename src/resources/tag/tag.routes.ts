import { Router } from 'express';
import validationMiddleware from '@/middleware/validation.middleware';
import validate from './tag.validation';
import tagController from './tag.controller';

const tagRouter = Router();
const basePath = '/tags';

tagRouter.get(basePath, tagController.getAllTags);

// roleAuth: admins manage available tags, users can request for new tag(s)
tagRouter.post(basePath, validationMiddleware(validate.create, 'body'), tagController.create);

export default tagRouter;
