import 'dotenv/config';
import request from 'supertest';
import App from '../app';
import { connectDB, closeDB } from './mongooseTestDB';
import PostController from '@/resources/post/post.controller';
import UserController from '@/resources/user/user.controller';

const app = new App([new PostController(), new UserController()], 3000).express;  

const postPayload = {
  title: 'new post',
  body: 'test post sent with supertest'
};

describe('Api base /api endpoint', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  describe('/posts endpoint', () => {
    it('should not successfully read data from the database', async () => {
      await request(app).get('/api/posts').expect(404);
    });

    it('should create a new post document if post title and body are in the incomming request', async () => {
      const res = await request(app).post('/api/posts').send(postPayload);
            
      expect(res.statusCode).toBe(201);
      expect(res.body.post.title).toBe(postPayload.title);
      expect(res.body.post.body).toBe(postPayload.body);
    });

    it('should not create a post if post title and body are missing in request', async () => {
      const res = await request(app).post('/api/posts').send({});

      expect(res.statusCode).toBe(400);
    });
  });

  describe('/user endpoint', () => {
    it('should not allow unauthenticated users', async () => {
      await request(app).get('/api/user').expect(401);
    });
  });
});
