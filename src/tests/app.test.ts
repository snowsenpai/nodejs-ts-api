import request from 'supertest';
import App from '../app';
import { connectDB, dropDB, dropCollections } from './mongooseTestDB';
import postModel from '@/resources/post/post.model';
import PostController from '@/resources/post/post.controller';

const app = new App([new PostController()], 3000).express;

const testPost = {
  title: 'new post',
  body: 'post sent from test'
}

describe('Api base /api endpoint', () => {
  beforeAll(async ()=>{
    await connectDB()
  });

  afterEach(async () => {
    await dropCollections()
  })

  afterAll(async () =>{
    await dropDB()
  });

  describe('/post endpoint', () => {
    // given GET: /post is not created
    it('should not successfully read data from the database', async () => {
      await request(app).get('/api/post').expect(404);
    });

    it('should create a new post document successfully', async () => {
      const newPost = await postModel.create(testPost);
      expect(newPost._id).toBeDefined();
      expect(newPost.title).toBe(testPost.title);
      expect(newPost.body).toBe(testPost.body);
    });
  });

  describe('/user endpoint', () => {
    it('should not allow unAuthenticated users', async () => {
      await request(app).get('/user').expect(401);
    });
  });
});
