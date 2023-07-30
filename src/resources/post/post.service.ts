import PostModel from "./post.model";
import Post from "./post.interface";
import { NotFound, BadRequest, Forbidden } from "@/utils/exceptions/client_error";

class PostService {
  private post = PostModel;

  /**
   * Create a new post
   */
  public async create(title: string, body: string, creator: string): Promise<Post | Error> {
    const post = await this.post.create({ title, body, creator });
    if(!post) {
      throw new BadRequest('Unable to create post');
    }
    return post;
  }

  /**
   * Find all posts
   */
  public async findAll() {
    // mongoose.Schema middleware to populate 'creator' and exclude '-password' for find*() queries?
    const posts = await this.post.find();
    if (!posts) {
      throw new NotFound('No post found')
    }

    return posts;
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
