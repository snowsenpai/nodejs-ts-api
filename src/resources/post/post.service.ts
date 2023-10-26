import PostModel from './post.model';
import TagService from '../tag/tag.service';
import PublicResource from '@/utils/interfaces/public-resource.interface';
import { HttpException, HttpStatus } from '@/utils/exceptions/index';
import { TPaginationDetails, TPaginationOptions } from '@/middleware/pagination.middleware';

/**
 * Encapsulates methods for interacting with the database to facilitate read, write,
 * create and destroy operations on `posts`.
 */
class PostService implements PublicResource {
  /**
   * Database intermediary for `posts`
   */
  private post = PostModel;
  private tags = new TagService();

  /**
   * Creates a new post document.
   *
   * @param title - Post's title.
   * @param body - Post's body/content.
   * @param creator - Post's author.
   * @param tags - Post's tags.
   * @returns the created post document.
   */
  public async create(title: string, body: string, creator: string, tags: string[]) {
    const post = await this.post.create({ title, body, creator, tags });

    return post;
  }

  /**
   * Returns filters used for querying available `posts` resources.
   *
   * @returns filter values for posts fields (e.g post.tags), default filter field name (e.g tags) and sort order.
   */
  public async paginationOptions() {
    const tagFilters = await this.tags.getTagFilters();
    const options: TPaginationOptions = {
      defaultFilter: tagFilters.defaultFilter,
      filters: {
        tags: tagFilters.tags,
      },
      defaultSort: tagFilters.tagSort,
    };
    return options;
  }

  /**
   * Return a array of existing posts and pagination details
   *
   * @param paginationDetails - pagination details for post resource.
   * @throws HttpException (404) if no post is found that match a specified query.
   */
  public async findAll(paginationDetails: TPaginationDetails) {
    const { filterValue, filterField, limit, page, search, sortBy } = paginationDetails;

    const searchQuery = { title: { $regex: search, $options: 'i' } };

    const posts = await this.post
      .find({ ...searchQuery })
      .where(filterField)
      .in([...filterValue])
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit);

    if (!posts.length) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'no post found');
    }

    const totalPostsFound = await this.post.countDocuments({
      ...searchQuery,
      [filterField]: { $in: [...filterValue] },
    });

    const hasNextPage = limit * page < totalPostsFound;
    const nextPage = hasNextPage ? page + 1 : null;
    const hasPrevPage = page > 1;
    const prevPage = hasPrevPage ? page - 1 : null;
    const lastPage = Math.ceil(totalPostsFound / limit);

    // if sending filterOptions, should be the filter 'name' not 'id'
    return {
      totalPostsFound,
      currentPage: page,
      nextPage,
      prevPage,
      lastPage,
      limit,
      filterOptions: filterValue,
      posts,
    };
  }

  /**
   * Returns a single post with an id field matching the given `id`.
   *
   * If `"true"` is received as a second argument the post's creator field will be replaced
   * with it's creator details (by default only the creator's id is present).
   * @param creator - Option to populate the post's creator field.
   * @param id - Post id to search for.
   * @throws HttpException (404) if no match is found.
   */
  public async findOne(id: string, creator?: string) {
    const post = await this.post.findById(id);
    if (!post) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'post not found');
    }
    if (creator === 'true') {
      return await post.populate('creator');
    }
    return post;
  }

  /**
   * Updates a single post document that match the given `postId`.
   *
   * `postData` should be the post field and it's new data,
   * data type of the field must match the original data type.
   * @param postId - The post id to search for.
   * @param postData - The field(s) to update.
   * @param userId - Id of the user making the request.
   * @throws HttpException (403) if `userId` does not match the post's creator `id`.
   * @throws HttpException (404) if the post could not be modified.
   */
  public async modifyPost(postId: string, postData: object, userId: string) {
    const post = await this.findOne(postId);

    if (post.creator.toString() !== userId.toString()) {
      throw new HttpException(HttpStatus.FORBIDDEN, 'You are not permitted');
    }

    const modifiedPost = await this.post.findByIdAndUpdate(postId, postData, { new: true });
    if (!modifiedPost) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'unable to modify post');
    }

    return modifiedPost;
  }

  /**
   * Deletes a single post document that match the given `postId`.
   *
   * @param postId - The post id to search for.
   * @param userId - Id of the user making the request.
   * @throws HttpException (403) if `userId` does not match the post's creator `id`.
   */
  public async deletePost(postId: string, userId: string) {
    const post = await this.findOne(postId);

    if (post.creator.toString() !== userId.toString()) {
      throw new HttpException(HttpStatus.FORBIDDEN, 'You are not permitted');
    }
    await post.deleteOne();

    return {
      postDeleted: true,
    };
  }
}

export default PostService;
