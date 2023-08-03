import { Router } from "express";
import validationMiddleware from "@/middleware/validation.middleware";
import validate from './tag.validation';
import tagContoller from "./tag.contoller";

const tagRouter = Router();
const basePath = '/tags';

// pre v2: role based authmw only ADMIN can access other endpoints
// Get '/' '/:id' are PUBLIC
tagRouter.get(
  basePath,
  tagContoller.getAllTags
);

tagRouter.post(
  basePath,
  validationMiddleware(validate.create),
  tagContoller.create
)

export default tagRouter;
