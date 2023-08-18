import PostModel from "./post.model";
import Post from "./post.interface";
import TagService from "../tag/tag.service";
import { NotFound, BadRequest, Forbidden } from "@/utils/exceptions/client-errors.utils";
import { TPaginationDetails, TPaginationOptions } from "@/middleware/pagination.middleware";

class PostService {
  private post = PostModel;
  private tags = new TagService();

  /**
   * Create a new post
   */
  public async create(title: string, body: string, creator: string, tags: string[]) {
    const post = await this.post.create({ title, body, creator, tags });
    if(!post) {
      throw new BadRequest('unable to create post');
    }
    return post;
  }

  /**
   * getPagiationOptions
   */
  public async getPagiationOptions() {
    const tagFilters = await this.tags.getTagFilters();
    const paginationOptions: TPaginationOptions = {
      defaultFilter: tagFilters.defaultFilter,
      filters: {
        tags: tagFilters.tags,
      },
      defaultSort: tagFilters.tagSort
    }
    return paginationOptions;
  }

  /**
   * Find all posts
   */
  public async findAll(paginationDetails: TPaginationDetails) {
    const {
      filterValue,
      filterField,
      limit,
      page,
      search,
      sortBy
    } = paginationDetails;

    // search field should be dev defined or retrieved from a dynamic queryOption(s)
    // e.g can query based on title, location name, etc, validation should be in place for fields 
    const searchQuery = { title: {$regex: search, $options: 'i'}};

    const posts = await this.post.find({...searchQuery})
    .where(filterField)
    .in([...filterValue])
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(limit);

    if (!posts.length) {
      throw new NotFound('no post found');
    }

    const totalPostsFound = await this.post.countDocuments({
      ...searchQuery,
      [filterField]: { $in: [...filterValue] },
    });

    const hasNextPage = limit * page < totalPostsFound;
    const nextPage = hasNextPage ? page + 1 : null;
    const hasPrevPage = page > 1;
    const prevPage = hasPrevPage ? page - 1 : null;
    const lastPage = Math.ceil(totalPostsFound/limit);

    // imporvement: if sending filterOptions, should be the filter 'name' not 'id'
    return {
      totalPostsFound,
      currentPage: page,
      nextPage,
      prevPage,
      lastPage,
      limit,
      filterOptions: filterValue,
      posts
    };
  }

  /**
   * Find a single post, `creator` option determines if the creator field in a post should be populated
   * by the full creator document (excluding password)
   */
  public async findOne(id: string, creator?: string) {
    const post = await this.post.findById(id);
    if (!post) {
      throw new NotFound('post not found');
    }
    if (creator === 'true') {
      return await post.populate('creator');
    }
    return post;
  }

  /**
   * Modify a single post
   */
  public async modifyPost(postId: string, postData: object, userId: string) {
    const post = await this.findOne(postId);

    if (post.creator.toString() !== userId.toString()) {
      throw new Forbidden();
    }

    const modifiedPost = await this.post.findByIdAndUpdate(postId, postData, { new: true });
    if (!modifiedPost) {
      throw new NotFound('unable to modify post');
    }

    return modifiedPost;
  }

  /**
   * Delete a single post
   */
  public async deletePost(postId: string, userId: string) {
    const post = await this.findOne(postId);

    if (post.creator.toString() !== userId.toString()) {
      throw new Forbidden();
    }
    await post.deleteOne();

    return 'post deleted succcessfully';
  }
}

export default PostService;
