import PostService from "./post.service";
import PostModel from "./post.model";

jest.mock('./post.model', () => {
  return {
    create: jest.fn(),
  };
});


describe('PostService', () => {
  let postService: PostService;
  let mockPostModel: jest.Mocked<typeof PostModel>;

  const title = 'new post';
  const body = 'new test post body';

  const post = {
    title: 'title',
    body: 'body'
  };

  beforeEach(() => {
    postService = new PostService();
    mockPostModel = PostModel as jest.Mocked<typeof PostModel>;
    // postService['post'] = mockPostModel;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a new post', async () => {
      mockPostModel.create
      // @ts-ignore
      .mockResolvedValue(post);
      const response = await postService.create(title, body);

      expect(mockPostModel.create).toHaveBeenCalledWith({
        title, body
      });
      expect(response).toEqual(post);
    });

    it('should throw an error if post creation fails',async () => {
      const errorMessage = 'Unable to create post';
      jest.spyOn(postService, 'create')
      .mockRejectedValueOnce(new Error(errorMessage));

      await expect(postService.create(title, body)).rejects.toThrow(errorMessage);
    });
  });
});