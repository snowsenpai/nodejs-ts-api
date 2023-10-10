import { appPath, testApp } from 'tests/app-test';
import request from 'supertest';
import { connectDB, dropCollection, closeDB } from '@/utils/database/mongoose-test.util';
import { HttpStatus } from '@/utils/exceptions';
import { sampleUser, sampleTag, samplePost } from 'tests/sample-data';

jest.mock('@sendgrid/mail');

const postPath = `${appPath}/posts`;

const tagPath = `${appPath}/tags`;
const userPath = `${appPath}/user`;
const authPath = `${appPath}/auth`;

let tagId: string;
const testUserPass = 'testPassword';
let accessToken: string;
let postId: string;

describe('/post', () => {
  beforeAll(async () => {
    await connectDB();

    tagId = (await request(testApp).post(tagPath).send(sampleTag)).body.data._id;
    await request(testApp).post(`${userPath}/register`).send({
      firstName: sampleUser.firstName,
      lastName: sampleUser.lastName,
      email: sampleUser.email,
      password: testUserPass,
    });
    accessToken = (
      await request(testApp)
        .post(`${authPath}/login`)
        .send({ email: sampleUser.email, password: testUserPass })
    ).body.data.accessToken.token;
  });

  afterAll(async () => {
    await dropCollection('posts');
    await dropCollection('tags');
    await dropCollection('users');
    await closeDB();
  });

  describe('POST /', () => {
    it('should insert a new post record into the db and respond with 201', async () => {
      const res = await request(testApp)
        .post(postPath)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: samplePost.title,
          body: samplePost.body,
          tags: [tagId],
        });
      postId = res.body.data._id;

      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('title', samplePost.title);
      expect(res.body.data).toHaveProperty('body', samplePost.body);
      expect(res.body.data).toHaveProperty('tags');
      expect(res.body.data).toHaveProperty('creator');
    });
  });

  describe('GET /', () => {
    it('should respond with 200 and available posts in a paginated format if query params are undefined', async () => {
      const res = await request(testApp).get(postPath);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toHaveProperty('message');
    });

    it('should respond with 200 and available posts in a paginated format if filterValue query param is defined', async () => {
      const res = await request(testApp).get(`${postPath}/?filterValue=${tagId}`);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toHaveProperty('message');
    });
  });
  // describe('GET /:id', () => {});
  // describe('PATCH /', () => {});
  // describe('DELETE /', () => {});
});
