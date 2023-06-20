import PostModel from "./post.model";
import Post from "./post.interface";
// TODO better error handling in services and controllers
class PostService {
  private post = PostModel;

  /**
   * Create a new post
   */
  public async create(title: string, body: string, creator: string): Promise<Post | Error> {
    try {
      const post = await this.post.create({ title, body, creator });

      return post;
    } catch (error) {
      throw new Error('Unable to create post');
    }
  }

  /**
   * Find all posts
   */
  public async findAll() {
    // mongoose.Schema middleware to populate 'creator' and exclude '-password' for find*() queries?
    const posts = await this.post.find();

    return posts;
  }

  /**
   * Find a single post, `creator` option determines if the creator field in a post should be populated
   * by the full creator document (excluding password)
   */
  public async findOne(id: string, creator?: any) {
    const post = await this.post.findById(id);
    if (creator === 'true') {
      // if creator is populated, creator field will be the full doc, post.creator.toString() !== userId.toString() wil not work
      // toString() wont work on creator field
      return post?.populate('creator', '-password');
    }
    return post;
  }

  /**
   * Modify a single post
   */
  public async modifyPost(postId: string, postData: object, userId: string) {
    const post = await this.findOne(postId);

    if (!post) {
      throw new Error('Post not found');
    }
    if (post.creator.toString() !== userId.toString()) {
      throw new Error('Not authorized');
    }

    const modifiedPost = await this.post.findByIdAndUpdate(postId, postData, { new: true });

    return modifiedPost;
    
  }

  /**
   * Delete a single post
   */
  public async deletePost(postId: string, userId: string) {
    const post = await this.findOne(postId);

    if (!post) {
      throw new Error('post not found');
    }
    if (post.creator.toString() !== userId.toString()) {
      throw new Error('Not authorized');
    }
    await post.deleteOne();

    return 'Post deleted';
  }
}

export default PostService;
