import request from 'supertest';
import App from '../../app';
import PostController from './post.controller';

const app = new App([new PostController()], 3000).express;

const testPost = {
  title: 'test',
  body: 'test post body'
};

describe('Post controller', () => {
  it('should create a new post', async () => {
    const mockPostController = jest.spyOn(PostController.prototype as any, 'create')
    .mockReturnValueOnce({
      id: Date.now(),
      ...testPost
    });
    const res = await request(app).post('/api/posts').send(testPost);
    
    console.log(res.body)
    expect(res.statusCode).toBe(201);
    expect(mockPostController).toHaveBeenCalled();
  });
});
