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
let creatorId: string;
let user2AccessToken: string;

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

    await request(testApp).post(`${userPath}/register`).send({
      firstName: 'user',
      lastName: 'two',
      email: 'user@two.com',
      password: 'user2pass',
    });

    accessToken = (
      await request(testApp)
        .post(`${authPath}/login`)
        .send({ email: sampleUser.email, password: testUserPass })
    ).body.data.accessToken.token;

    creatorId = (await request(testApp).get(userPath).set('Authorization', `Bearer ${accessToken}`))
      .body.data._id;

    user2AccessToken = (
      await request(testApp)
        .post(`${authPath}/login`)
        .send({ email: 'user@two.com', password: 'user2pass' })
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
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toMatchObject({
        totalPostsFound: 1,
        currentPage: 1,
        nextPage: null,
        prevPage: null,
        lastPage: 1,
        limit: 5,
        filterOptions: [tagId],
        posts: [expect.objectContaining({ _id: postId })],
      });
    });

    it('should respond with 200 and available posts in a paginated format if filterValue query param is defined', async () => {
      const res = await request(testApp).get(`${postPath}/?filterValue=${tagId}`);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toMatchObject({
        totalPostsFound: 1,
        currentPage: 1,
        nextPage: null,
        prevPage: null,
        lastPage: 1,
        limit: 5,
        filterOptions: [tagId],
        posts: [expect.objectContaining({ _id: postId })],
      });
    });
  });

  describe('GET /:id', () => {
    it('should respond with a single existing post object with creator id reference', async () => {
      const res = await request(testApp).get(`${postPath}/${postId}`);

      expect(res.status).toEqual(HttpStatus.OK);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('_id', postId);
      expect(res.body.data).toHaveProperty('creator', creatorId);
    });

    it('should respond with a single existing post object with creator field populated', async () => {
      const res = await request(testApp).get(`${postPath}/${postId}/?creator=true`);

      expect(res.status).toEqual(HttpStatus.OK);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('_id', postId);
      expect(res.body.data).toHaveProperty('creator', expect.objectContaining({ _id: creatorId }));
    });
  });

  describe('PATCH /:id', () => {
    it('should allow post creator to update their existing post', async () => {
      const res = await request(testApp)
        .patch(`${postPath}/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ body: 'body has been updated!', tags: [tagId] });

      expect(res.status).toEqual(HttpStatus.OK);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('_id', postId);
      expect(res.body.data).toHaveProperty('body', 'body has been updated!');
      expect(res.body.data).toHaveProperty('tags', [expect.objectContaining({ _id: tagId })]);
    });

    it('should prevent an unauthorized user from editing an existing post they didn`t create', async () => {
      const res = await request(testApp)
        .patch(`${postPath}/${postId}`)
        .set('Authorization', `Bearer ${user2AccessToken}`)
        .send({ body: 'should not update', tags: [tagId] });

      expect(res.status).toEqual(HttpStatus.FORBIDDEN);
      expect(res.body).toHaveProperty('message', 'You are not permitted');
    });
  });

  describe('DELETE /:id', () => {
    it('should prevent an unauthorized user from deleting an existing post they didn`t create', async () => {
      const res = await request(testApp)
        .delete(`${postPath}/${postId}`)
        .set('Authorization', `Bearer ${user2AccessToken}`);

      expect(res.status).toEqual(HttpStatus.FORBIDDEN);
      expect(res.body).toHaveProperty('message', 'You are not permitted');
    });

    it('should allow post creator to delete their existing post', async () => {
      const res = await request(testApp)
        .delete(`${postPath}/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toEqual(HttpStatus.OK);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('postDeleted', true);
    });

    it('should respond with 404 if a postId has beend deleted', async () => {
      const res = await request(testApp)
        .delete(`${postPath}/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toEqual(HttpStatus.NOT_FOUND);
      expect(res.body).toHaveProperty('message');
    });
  });
});
