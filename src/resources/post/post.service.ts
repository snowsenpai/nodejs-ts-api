import PostModel from "./post.model";
import Post from "./post.interface";

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
}

export default PostService;
