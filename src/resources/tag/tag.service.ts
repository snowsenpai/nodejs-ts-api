import { TagModel } from './tag.model';
import { HttpException, HttpStatus } from '@/utils/exceptions/index';

/**
 * Encapsulates methods for interacting with the database to facilitate read, write,
 * create and destroy operations on `tags`.
 */
class TagService {
  /**
   * Database intermediary for `tags`
   */
  private tag = TagModel;

  /**
   * Creates a new tag document.
   *
   * `Unhandled error` - thrown if a tag with an identical name exists in the database.
   * @param name - Tag name.
   * @param description - Tag description.
   * @returns created tag document.
   */
  public async create(name: string, description: string) {
    //! check for existing tag name
    const tag = await this.tag.create({ name, description });
    return tag;
  }

  /**
   * Returns an array of existing tags.
   * @throws HttpException (404) if no tag is found.
   */
  public async findAll() {
    const tags = await this.tag.find({});
    if (!tags.length) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'no tags added yet');
    }
    return tags;
  }

  /**
   * Returns filters used for querying resources that depend on `tags`.
   * @returns all available tags ids, default filter name and sort order.
   */
  public async getTagFilters() {
    const tags = (await this.tag.find({})).map((doc) => doc.id as string);
    const defaultFilter = 'tags';
    const tagSort = 'asc'; //ascending
    const tagPaginationOption = {
      defaultFilter,
      tags,
      tagSort,
    };
    return tagPaginationOption;
  }
}

export { TagService };
