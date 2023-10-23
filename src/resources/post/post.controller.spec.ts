import postController from './post.controller';
import PostService from './post.service';
import { HttpException, HttpStatus } from '@/utils/exceptions';
import { getMockReq, getMockRes } from '@jest-mock/express';
import {
  samplePost,
  samplePostPopulated,
  sampleUser,
  objectId,
  getPaginationDetails,
  getPaginationResult,
} from 'tests/sample-data';

describe('PostController', () => {
  describe('create', () => {
    it('should respond with 201 and a created post', async () => {
      const req = getMockReq({
        body: {
          title: samplePost.title,
          body: samplePost.body,
          tags: samplePost.tags,
        },
        user: sampleUser,
      });
      const { res, next } = getMockRes();
      const createSpy = jest.spyOn(postController, 'create');
      const serviceSpy = jest
        .spyOn(PostService.prototype, 'create')
        // @ts-ignore
        .mockResolvedValue(samplePost);

      await postController.create(req, res, next);

      expect(createSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(
        samplePost.title,
        samplePost.body,
        sampleUser._id,
        samplePost.tags,
      );
      expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'post created successfully',
          data: samplePost,
        }),
      );
    });

    it('should call next with HttpException if an error occurs', async () => {
      const req = getMockReq();
      const { res, next } = getMockRes();
      const createSpy = jest.spyOn(postController, 'create');
      const error = new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'things exploded?');
      const serviceSpy = jest
        .spyOn(PostService.prototype, 'create')
        // @ts-ignore
        .mockRejectedValue(error);

      await postController.create(req, res, next);

      expect(createSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalled();
      expect(serviceSpy).rejects.toThrowError(error);
      expect(res.status).not.toBeCalled();
      expect(res.json).not.toBeCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getAllPosts', () => {
    it('should respond with a paginated data and 200 status code', async () => {
      // eslint-disable-next-line prettier/prettier
      const paginationDetails = getPaginationDetails([objectId], 'tags', 1, 1, 'test', {
        asc: 'asc',
      });
      const paginationResult = getPaginationResult(1, null, null, 1);
      const req = getMockReq({
        paginationDetails,
      });
      const { res, next } = getMockRes();
      const getAllPostsSpy = jest.spyOn(postController, 'getAllPosts');

      const totalPostsFound = 1;
      const serviceSpy = jest.spyOn(PostService.prototype, 'findAll').mockResolvedValue({
        totalPostsFound,
        ...paginationResult,
        limit: paginationDetails.limit,
        filterOptions: paginationDetails.filterValue,
        // @ts-ignore
        posts: [samplePost],
      });

      await postController.getAllPosts(req, res, next);

      expect(getAllPostsSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.paginationDetails).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(paginationDetails);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'all available posts retrieved',
          data: {
            totalPostsFound,
            ...paginationResult,
            limit: paginationDetails.limit,
            filterOptions: paginationDetails.filterValue,
            posts: [samplePost],
          },
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if an error occurs', async () => {
      // eslint-disable-next-line prettier/prettier
      const paginationDetails = getPaginationDetails([objectId], 'tags', 1, 1, 'test', {
        asc: 'asc',
      });
      const req = getMockReq({
        paginationDetails,
      });
      const { res, next } = getMockRes();
      const getAllPostsSpy = jest.spyOn(postController, 'getAllPosts');

      const error = new HttpException(HttpStatus.NOT_FOUND, 'no post found');
      jest.spyOn(PostService.prototype, 'findAll').mockRejectedValue(error);

      await postController.getAllPosts(req, res, next);

      expect(getAllPostsSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.paginationDetails).toBeDefined();
      expect(res.status).not.toBeCalled();
      expect(res.json).not.toBeCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getPostById', () => {
    it('should respond with 200 and a retrieved post with creator reference', async () => {
      const req = getMockReq({
        params: {
          id: samplePost._id,
        },
      });
      const { res, next } = getMockRes();

      const getPostByIdSpy = jest.spyOn(postController, 'getPostById');
      const serviceSpy = jest
        .spyOn(PostService.prototype, 'findOne')
        // @ts-ignore
        .mockResolvedValue(samplePost);
      await postController.getPostById(req, res, next);

      expect(getPostByIdSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith(samplePost._id);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'post retrieved',
          data: samplePost,
        }),
      );
    });

    it('should respond with 200 and a retrieved post with creator field populated', async () => {
      const req = getMockReq({
        params: {
          id: samplePost._id,
        },
        query: {
          creator: 'true',
        },
      });
      const { res, next } = getMockRes();

      const getPostByIdSpy = jest.spyOn(postController, 'getPostById');
      const serviceSpy = jest
        .spyOn(PostService.prototype, 'findOne')
        // @ts-ignore
        .mockResolvedValue(samplePostPopulated);
      await postController.getPostById(req, res, next);

      expect(getPostByIdSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith(samplePost._id, 'true');
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'post retrieved',
          data: samplePostPopulated,
        }),
      );
    });

    it('should call next with HttpException if an error occurs', async () => {
      const req = getMockReq({
        params: {
          id: objectId,
        },
      });
      const { res, next } = getMockRes();

      const getPostByIdSpy = jest.spyOn(postController, 'getPostById');
      const error = new HttpException(HttpStatus.NOT_FOUND, 'post not found');
      jest
        .spyOn(PostService.prototype, 'findOne')
        // @ts-ignore
        .mockRejectedValue(error);
      await postController.getPostById(req, res, next);

      expect(getPostByIdSpy).toHaveBeenCalledWith(req, res, next);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('modifyPost', () => {
    it('should modify an existing post and respond with 200', async () => {
      const newData = { title: 'New test title' };
      const req = getMockReq({
        params: {
          id: samplePost._id,
        },
        user: sampleUser,
        body: newData,
      });
      const { res, next } = getMockRes();
      const modifyPostSpy = jest.spyOn(postController, 'modifyPost');
      const serviceSpy = jest
        .spyOn(PostService.prototype, 'modifyPost')
        // @ts-ignore
        .mockResolvedValue({ ...samplePost, ...newData });

      await postController.modifyPost(req, res, next);

      expect(modifyPostSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(samplePost._id, newData, sampleUser._id);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'post updated successfully',
          data: {
            ...samplePost,
            ...newData,
          },
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should not modify an existong post if creatorId and userId do not match', async () => {
      const newData = { title: 'New test title' };
      const req = getMockReq({
        params: {
          id: samplePost._id,
        },
        user: {
          ...sampleUser,
          _id: objectId,
        },
        body: newData,
      });
      const { res, next } = getMockRes();

      const error = new HttpException(HttpStatus.FORBIDDEN, 'You are not permitted');
      const modifyPostSpy = jest.spyOn(postController, 'modifyPost');
      const serviceSpy = jest
        .spyOn(PostService.prototype, 'modifyPost')
        // @ts-ignore
        .mockRejectedValue(error);

      await postController.modifyPost(req, res, next);

      expect(modifyPostSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith(samplePost._id, newData, objectId);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deletePost', () => {
    it('should respond with 201 and a confirmation message', async () => {
      const req = getMockReq({
        params: {
          id: samplePost._id,
        },
        user: sampleUser,
      });
      const { res, next } = getMockRes();
      const deletePostSpy = jest.spyOn(postController, 'deletePost');

      const data = { postDeleted: true };
      const serviceSpy = jest.spyOn(PostService.prototype, 'deletePost').mockResolvedValue(data);

      await postController.deletePost(req, res, next);

      expect(deletePostSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(samplePost._id, sampleUser._id);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'post deleted successfully',
          data,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should not delete a post if creator and userId does not match', async () => {
      const req = getMockReq({
        params: {
          id: samplePost._id,
        },
        user: {
          ...sampleUser,
          _id: objectId,
        },
      });
      const { res, next } = getMockRes();

      const deletePostSpy = jest.spyOn(postController, 'deletePost');

      const error = new HttpException(HttpStatus.FORBIDDEN, 'You are not permitted');
      const serviceSpy = jest.spyOn(PostService.prototype, 'deletePost').mockRejectedValue(error);

      await postController.deletePost(req, res, next);

      expect(deletePostSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(samplePost._id, objectId);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
