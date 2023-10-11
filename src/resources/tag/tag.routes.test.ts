import { apiPaths, testApp } from 'tests/app-test';
import request from 'supertest';
import { connectDB, dropCollection, closeDB } from '@/utils/database/mongoose-test.util';
import { HttpStatus } from '@/utils/exceptions';
import { sampleTag } from 'tests/sample-data';

describe('/tags', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await dropCollection('tags');
    await closeDB();
  });

  describe('POST /', () => {
    it('add a new tag to the db', async () => {
      const res = await request(testApp).post(apiPaths.tagPath).send(sampleTag);

      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body).toHaveProperty('message');
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data).toHaveProperty('name', sampleTag.name);
      expect(res.body.data).toHaveProperty('description', sampleTag.description);
    });

    it('should respond with a 400 if incoming data validation fails', async () => {
      const res = await request(testApp).post(apiPaths.tagPath).send({
        name: '',
        description: '',
      });

      expect(res.status).toEqual(HttpStatus.BAD_REQUEST);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('GET /', () => {
    it('should respond with an array of available tags', async () => {
      const res = await request(testApp).get(apiPaths.tagPath);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toEqual([
        expect.objectContaining({ name: sampleTag.name, description: sampleTag.description }),
      ]);
    });
  });
});
