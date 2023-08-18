import { Router } from "express";
import validationMiddleware from "@/middleware/validation.middleware";
import validate from './tag.validation';
import tagContoller from "./tag.controller";

const tagRouter = Router();
const basePath = '/tags';

//! role based authmiddleware
// Get '/' & '/:id' are PUBLIC others require ADMIN role
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
