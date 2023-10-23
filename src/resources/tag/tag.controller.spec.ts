import tagController from './tag.controller';
import TagService from './tag.service';
import { HttpException, HttpStatus } from '@/utils/exceptions';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { sampleTag } from 'tests/sample-data';

describe('TagController', () => {
  describe('create', () => {
    it('should respond with 201 and a created tag', async () => {
      const req = getMockReq({
        body: {
          name: sampleTag.name,
          description: sampleTag.description,
        },
      });
      const { res, next } = getMockRes();
      const createSpy = jest.spyOn(tagController, 'create');

      const serviceSpy = jest
        .spyOn(TagService.prototype, 'create')
        // @ts-ignore
        .mockResolvedValue(sampleTag);
      await tagController.create(req, res, next);

      expect(createSpy).toBeCalledWith(req, res, next);
      expect(serviceSpy).toBeCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'tag created successfully',
          data: sampleTag,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if an error occurs', async () => {
      const req = getMockReq();
      const { res, next } = getMockRes();
      const createSpy = jest.spyOn(tagController, 'create');

      const error = new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'things exploded!');
      jest.spyOn(TagService.prototype, 'create').mockRejectedValue(error);
      await tagController.create(req, res, next);

      expect(req.body).toStrictEqual({});
      expect(createSpy).toBeCalledWith(req, res, next);
      expect(res.status).not.toBeCalled();
      expect(res.json).not.toBeCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getAllTags', () => {
    it('should return an array of available tags and 200 status', async () => {
      const req = getMockReq();
      const { res, next } = getMockRes();
      const getAllTagSpy = jest.spyOn(tagController, 'getAllTags');
      const serviceSpy = jest.spyOn(TagService.prototype, 'findAll');
      serviceSpy
        // @ts-ignore
        .mockResolvedValue([sampleTag]);

      await tagController.getAllTags(req, res, next);

      expect(getAllTagSpy).toHaveBeenCalledWith(req, res, next);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'available tags retrieved',
          data: [sampleTag],
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if an error occurs', async () => {
      const req = getMockReq();
      const { res, next } = getMockRes();
      const getAllTagSpy = jest.spyOn(tagController, 'getAllTags');
      const serviceSpy = jest.spyOn(TagService.prototype, 'findAll');
      const error = new HttpException(HttpStatus.NOT_FOUND, 'no tags added yet');
      serviceSpy
        // @ts-ignore
        .mockRejectedValue(error);

      await tagController.getAllTags(req, res, next);

      expect(getAllTagSpy).toHaveBeenCalledWith(req, res, next);
      expect(res.status).not.toBeCalled();
      expect(res.json).not.toBeCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
