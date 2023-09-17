import PostService from './post.service';
import PostModel from './post.model';
import TagService from '../tag/tag.service';
import { HttpException, HttpStatus } from '@/utils/exceptions';
import {
  objectId,
  samplePost,
  samplePostPopulated,
  sampleUser,
  tagsId,
  getPaginationDetails,
  getPaginationResult,
} from 'tests/sample-data';

describe('PostService', () => {
  let postService: PostService;

  beforeEach(() => {
    postService = new PostService();
  });

  describe('create', () => {
    it('should create then return a new post', async () => {
      const postModelSpy = jest
        .spyOn(PostModel, 'create')
        // @ts-ignore
        .mockResolvedValue(samplePost);
      const result = await postService.create('test post', 'tests can be nice', 'userId', tagsId);

      expect(result).toEqual(samplePost);
      expect(postModelSpy).toHaveBeenCalledWith({
        title: 'test post',
        body: 'tests can be nice',
        creator: 'userId',
        tags: tagsId,
      });
    });
  });

  describe('paginationOptions', () => {
    it('should return pagination options', async () => {
      const tagFilters = {
        defaultFilter: 'tags',
        tagSort: 'asc',
        tags: tagsId,
      };
      const tagServiceSpy = jest
        .spyOn(TagService.prototype, 'getTagFilters')
        .mockResolvedValue(tagFilters);

      const result = await postService.paginationOptions();

      expect(tagServiceSpy).toHaveBeenCalled();
      expect(result).toEqual({
        defaultFilter: 'tags',
        defaultSort: 'asc',
        filters: { tags: tagsId },
      });
    });
  });

  describe('findAll', () => {
    it('should return all post found and pagination result', async () => {
      const paginationResult = getPaginationResult(1, null, null, 1);
      // eslint-disable-next-line prettier/prettier
      const paginationDetails = getPaginationDetails([objectId], 'tags', 1, 1, 'test', {
        asc: 'asc',
      });

      const postModelSpy = jest
        .spyOn(PostModel, 'find')
        // @ts-ignore
        .mockReturnValue({
          where: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([samplePost]),
        });

      const totalPostsFound = 1;
      const countDocumentsSpy = jest
        .spyOn(PostModel, 'countDocuments')
        .mockResolvedValue(totalPostsFound);

      const result = await postService.findAll(paginationDetails);

      expect(postModelSpy).toHaveBeenCalled();
      expect(countDocumentsSpy).toHaveBeenCalled();
      expect(result).toEqual({
        totalPostsFound,
        ...paginationResult,
        limit: paginationDetails.limit,
        filterOptions: paginationDetails.filterValue,
        posts: [samplePost],
      });
    });

    it('should throw HttpException if no posts are found', async () => {
      // eslint-disable-next-line prettier/prettier
      const paginationDetails = getPaginationDetails([objectId], 'tags', 1, 1, 'test', {
        asc: 'asc',
      });

      const postModelSpy = jest
        .spyOn(PostModel, 'find')
        // @ts-ignore
        .mockReturnValue({
          where: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([]),
        });
      const countDocumentsSpy = jest.spyOn(PostModel, 'countDocuments');

      await expect(postService.findAll(paginationDetails)).rejects.toThrow(
        new HttpException(HttpStatus.NOT_FOUND, 'no post found'),
      );
      expect(countDocumentsSpy).not.toHaveBeenCalled();
      expect(postModelSpy).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an existing post with a creator refrence', async () => {
      const postModelSpy = jest.spyOn(PostModel, 'findById').mockResolvedValue(samplePost);

      const result = await postService.findOne(samplePost._id);

      expect(postModelSpy).toHaveBeenCalled();
      expect(result).toEqual(samplePost);
    });

    it('should return an existing post with a populated creator field', async () => {
      const postModelSpy = jest.spyOn(PostModel, 'findById').mockResolvedValue(samplePostPopulated);
      const findOneSpy = jest.spyOn(PostService.prototype, 'findOne');

      const result = await postService.findOne(samplePost._id, sampleUser._id);

      expect(postModelSpy).toHaveBeenCalled();
      expect(findOneSpy).toHaveBeenCalledWith(samplePost._id, sampleUser._id);
      expect(result).toEqual(samplePostPopulated);
      //? expect(result.creator).toEqual(sampleUser);
    });

    it('should throw HttpException is a post is not found', async () => {
      const postModelSpy = jest.spyOn(PostModel, 'findById').mockResolvedValue(null);

      await expect(postService.findOne('123456789')).rejects.toThrow(
        new HttpException(HttpStatus.NOT_FOUND, 'post not found'),
      );
      expect(postModelSpy).toHaveBeenCalled();
    });
  });

  describe('modifyPost', () => {
    it('should modify an existing post', async () => {
      const findOneSpy = jest
        .spyOn(PostService.prototype, 'findOne')
        // @ts-ignore
        .mockResolvedValue(samplePost);
      const newData = { body: 'tests can be very long' };
      const postModelSpy = jest
        .spyOn(PostModel, 'findByIdAndUpdate')
        .mockResolvedValue({ ...samplePost, newData });

      const result = await postService.modifyPost(samplePost._id, newData, sampleUser._id);

      expect(findOneSpy).toHaveBeenCalled();
      expect(postModelSpy).toHaveBeenCalled();
      expect(result).toEqual({ ...samplePost, newData });
    });

    it("should not modify an existing post if the creatorId and userId don't match", async () => {
      const findOneSpy = jest
        .spyOn(PostService.prototype, 'findOne')
        // @ts-ignore
        .mockResolvedValue(samplePost);
      const newData = { body: 'tests can be very long' };
      const postModelSpy = jest
        .spyOn(PostModel, 'findByIdAndUpdate')
        .mockResolvedValue({ ...samplePost, newData });

      await expect(postService.modifyPost(samplePost._id, newData, objectId)).rejects.toThrow(
        new HttpException(HttpStatus.FORBIDDEN, 'You are not permitted'),
      );
      expect(findOneSpy).toHaveBeenCalled();
      expect(postModelSpy).not.toHaveBeenCalled();
    });

    it('should throw HttpException if findByIdAndupdate returns null', async () => {
      const findOneSpy = jest
        .spyOn(PostService.prototype, 'findOne')
        // @ts-ignore
        .mockResolvedValue(samplePost);
      const newData = { body: 'tests can be very long' };
      const postModelSpy = jest.spyOn(PostModel, 'findByIdAndUpdate').mockResolvedValue(null);

      await expect(postService.modifyPost(samplePost._id, newData, sampleUser._id)).rejects.toThrow(
        new HttpException(HttpStatus.NOT_FOUND, 'unable to modify post'),
      );
      expect(findOneSpy).toHaveBeenCalled();
      expect(postModelSpy).toHaveBeenCalled();
    });
  });

  describe('deletePost', () => {
    it('should delete an existing post', async () => {
      const findOneSpy = jest
        .spyOn(PostService.prototype, 'findOne')
        // @ts-ignore
        .mockResolvedValue(samplePost);

      const result = await postService.deletePost(samplePost._id, sampleUser._id);

      expect(findOneSpy).toHaveBeenCalled();
      expect(samplePost.deleteOne).toHaveBeenCalled();
      expect(result).toEqual({ postDeleted: true });
    });

    it("should not delete an existing post if the creatorId and userId don't match", async () => {
      const findOneSpy = jest
        .spyOn(PostService.prototype, 'findOne')
        // @ts-ignore
        .mockResolvedValue(samplePost);

      await expect(postService.deletePost(samplePost._id, objectId)).rejects.toThrow(
        new HttpException(HttpStatus.FORBIDDEN, 'You are not permitted'),
      );
      expect(findOneSpy).toHaveBeenCalled();
      expect(samplePost.deleteOne).not.toHaveBeenCalled();
    });
  });
});
