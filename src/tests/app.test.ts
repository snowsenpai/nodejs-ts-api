import 'dotenv/config';
import request from 'supertest';
import App from '../app';
import { connectDB, closeDB } from './mongooseTestDB';
import PostController from '@/resources/post/post.controller';
import PostService from '@/resources/post/post.service';
import UserController from '@/resources/user/user.controller';
import UserService from '@/resources/user/user.service';
import postModel from '@/resources/post/post.model';

const postController = new PostController();
const userController = new UserController();

// postController['PostService'] = new PostService();
// userController['UserService'] = new UserService();

const app = new App([new PostController(), new UserController()], 3000).express;  

const postPayload = {
  title: 'new post',
  body: 'test post sent with supertest'
};

describe('Api base /api endpoint', () => {
  beforeEach(async () => {
    await connectDB();
  });

  afterEach(async () => {
    await closeDB();
  });

  describe('/posts endpoint', () => {
    it.skip('should not successfully read data from the database', async () => {
      await request(app).get('/api/posts').expect(404);
    });

    // returns 400, cannot read 'PostService', undefined
    it('should create a new post document if post title and body are in the incomming request', async () => {
      const res = await request(app).post('/api/posts').send(postPayload);
      
      console.log(res.body);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.post.title).toBe(postPayload.title);
      expect(res.body.post.body).toBe(postPayload.body);
    });

    it.skip('should create a new post document if title and body are valid', async () => {
      const newPost = await postModel.create(postPayload);

      expect(newPost._id).toBeDefined();
      expect(newPost.title).toBe(postPayload.title);
      expect(newPost.body).toBe(postPayload.body);
    });

    it.skip('should not create a post if post title and body are missing in request', async () => {
      const res = await request(app).post('/api/posts').send({});

      expect(res.statusCode).toBe(400);
    });
  });

  describe.skip('/user endpoint', () => {
    it('should not allow unauthenticated users', async () => {
      await request(app).get('/user').expect(401);
    });
  });
});
