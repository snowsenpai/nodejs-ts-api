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
    // mongoose.Schema middleware to populate 'creator' and exclude '-password' for find*() queries
    const posts = await this.post.find().populate('creator', '-password');

    return posts;
  }

  /**
   * Find a single post
   */
  public async findOne(id: string) {
    const post = await this.post.findById(id).populate('creator', '-password');

    return post;
  }

  /**
   * Modify a single post
   */
  public async modifyPost(postId: string, postData: object) {
    // only creators can modify or delete their posts
    const post = await this.post.findByIdAndUpdate(postId, postData, { new: true });

    if (post) {
      return this.findOne(postId);
    }
  }

  /**
   * Delete a single post
   */
  public async deletePost(postId: string) {
    // const post = await this.findOne(postId); //check if post.creator !== req.user._id
    await this.post.findByIdAndDelete(postId);

    return 'Post deleted';
  }
}

export default PostService;
