import TagService from './tag.service';
import TagModel from './tag.model';
import { HttpException, HttpStatus } from '@/utils/exceptions/index';
import { sampleTag } from 'tests/sample-data';

describe('TagService', () => {
  let tagService: TagService;

  beforeEach(() => {
    tagService = new TagService();
  });

  describe('create', () => {
    it('should create a new tag', async () => {
      const mockCreate = jest
        .spyOn(TagModel, 'create')
        // @ts-ignore
        .mockResolvedValueOnce(sampleTag);
      const result = await tagService.create('Test Tag', 'just used for testing');

      expect(result).toEqual(sampleTag);
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Test Tag',
        description: 'just used for testing',
      });
    });
  });

  describe('findAll', () => {
    it('should find all tags', async () => {
      const mockFind = jest.spyOn(TagModel, 'find').mockResolvedValueOnce([sampleTag]);
      const result = await tagService.findAll();

      expect(result).toEqual([sampleTag]);
      expect(mockFind).toHaveBeenCalledWith({});
    });

    it('should throw HttpException when no tags are found', async () => {
      const mockFind = jest.spyOn(TagModel, 'find').mockResolvedValueOnce([]);
      await expect(tagService.findAll()).rejects.toThrow(
        new HttpException(HttpStatus.NOT_FOUND, 'no tags added yet'),
      );
      expect(mockFind).toHaveBeenCalledWith({});
    });
  });

  describe('getTagFilters', () => {
    it('should return tag pagination options', async () => {
      const mockFind = jest
        .spyOn(TagModel, 'find')
        .mockResolvedValueOnce([{ id: 'tag1' }, { id: 'tag2' }]);

      const result = await tagService.getTagFilters();
      expect(result).toEqual({
        defaultFilter: 'tags',
        tags: ['tag1', 'tag2'],
        tagSort: 'asc',
      });
      expect(mockFind).toHaveBeenCalledWith({});
    });
  });
});
