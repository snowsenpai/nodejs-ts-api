import TagModel from "./tag.model";
import Tag from "./tag.interface";
import { NotFound, Forbidden, BadRequest } from "@/utils/exceptions/client-errors.utils";

class TagService {
  private tag = TagModel;

  /**
   * create
   */
  public async create(name: string, description: string) {
    const tag = await this.tag.create({ name, description });
    return tag;
  }

  /**
   * findAll
   */
  public async findAll() {
    const tags = await this.tag.find({});
    // TODO fix all empty array checks for find() queries or (!array.length)
    if (tags.length === 0) {
      throw new NotFound('No tags added yet');
    }
    return tags;
  }

  /**
   * getPaginationOptions
   */
  public async getTagFilters() {
    const tags = (await this.tag.find({})).map((doc) => doc.id as string);
    const defaultFilter = 'tags';
    const tagSort = 'asc'; //ascending
    const tagPaginationOption = {
      defaultFilter,
      tags,
      tagSort,
    }
    return tagPaginationOption;
  }
}

export default TagService;