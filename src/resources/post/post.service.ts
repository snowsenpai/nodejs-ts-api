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
  public async create(title: string, body: string, creator: string, tags: string[]): Promise<Post | Error> {
    const post = await this.post.create({ title, body, creator, tags });
    if(!post) {
      throw new BadRequest('Unable to create post');
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
    // TODO mongoose.Schema middleware to populate 'creator'?
    // TODO sorting find by tags {'tags': ''} and creator
    const {
      filterValue,
      filterField,
      limit,
      page,
      search,
      sortBy
    } = paginationDetails;

    const posts = await this.post.find({name: {$regex: search, $options: 'i'}})
    .where(filterField)
    .in([...filterValue])
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(limit);

    if (posts.length === 0) {
      throw new NotFound('No post found');
    }

    const total = await this.post.countDocuments({
      filterField: { $in: [...filterValue] },
      name: {$regex: search, $options: 'i'},
    });

    const hasNextPage = limit * page < total;
    const nextPage = hasNextPage ? page + 1 : null;
    const hasPrevPage = page > 1;
    const prevPage = hasPrevPage ? page - 1 : null;

    return {
      total,
      currentPage: page,
      nextPage,
      prevPage,
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

    // TODO switch to findOneAndUpdate? for tag middleware populating
    const modifiedPost = await this.post.findByIdAndUpdate(postId, postData, { new: true });

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

    return 'Post deleted';
  }
}

export default PostService;
