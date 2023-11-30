import { apiPaths, testApp } from 'tests/app-test';
import request from 'supertest';
import { connectDB, dropCollection, closeDB } from '@/utils/database/mongoose-test.util';
import { HttpStatus } from '@/utils/exceptions';
import { sampleFullUser, sampleTag, samplePost } from 'tests/sample-data';

jest.mock('@sendgrid/mail');

let userId: string;
let accessToken: string;

describe('/user', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await dropCollection('users');
    await dropCollection('posts');
    await dropCollection('tags');
    await closeDB();
  });

  describe('POST /', () => {
    it('should add a new user to the database and respond with 201', async () => {
      const res = await request(testApp).post(`${apiPaths.userPath}/register`).send({
        firstName: sampleFullUser.firstName,
        lastName: sampleFullUser.lastName,
        email: sampleFullUser.email,
        password: sampleFullUser.password,
      });

      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body).toHaveProperty('message');
      expect(res.body.data).toEqual({ createdNewUserAccount: true });
      accessToken = (
        await request(testApp)
          .post(`${apiPaths.authPath}/login`)
          .send({ email: sampleFullUser.email, password: sampleFullUser.password })
      ).body.data.accessToken.token;
    });
  });

  describe('GET /', () => {
    it('should return an existing user data when valid credentials are provided', async () => {
      const res = await request(testApp)
        .get(apiPaths.userPath)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toHaveProperty('message');
      expect(res.body.data).toHaveProperty('_id');
      userId = res.body.data._id;
      expect(res.body.data).toHaveProperty('firstName', sampleFullUser.firstName);
    });
  });

  describe('GET /:id', () => {
    it('should return an existing user if a valid id is provided', async () => {
      const res = await request(testApp).get(`${apiPaths.userPath}/${userId}`);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toHaveProperty('message');
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('firstName', sampleFullUser.firstName);
    });
  });

  describe('GET /:id/posts', () => {
    it('should return an existing user if a valid id is provided and post created by the user', async () => {
      const tagId = (await request(testApp).post(apiPaths.tagPath).send(sampleTag)).body.data._id;
      const postId = (
        await request(testApp)
          .post(apiPaths.postPath)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: samplePost.title,
            body: samplePost.body,
            tags: [tagId],
          })
      ).body.data._id;
      const res = await request(testApp).get(`${apiPaths.userPath}/${userId}/posts`);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toHaveProperty('message');
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('firstName', sampleFullUser.firstName);
      expect(res.body.data.posts).toBeDefined();
      expect(res.body.data.posts).toEqual([expect.objectContaining({ _id: postId })]);
    });
  });

  describe('PATCH /', () => {
    it('should only update a user`s firstName and/or lastName', async () => {
      const res = await request(testApp)
        .patch(apiPaths.userPath)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ firstName: 'Shunsui' });

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toHaveProperty('message');
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('firstName', 'Shunsui');
      expect(res.body.data).toHaveProperty('lastName', sampleFullUser.lastName);
    });
  });

  describe('DELETE /', () => {
    it('should delete an existing user data', async () => {
      const res = await request(testApp)
        .delete(apiPaths.userPath)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toHaveProperty('message');
      expect(res.body.data).toHaveProperty('deletedUserData', true);
    });

    it('should resond with 404 if a user`s data has been deleted from the database', async () => {
      const res = await request(testApp)
        .delete(apiPaths.userPath)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(HttpStatus.NOT_FOUND);
    });
  });
});
