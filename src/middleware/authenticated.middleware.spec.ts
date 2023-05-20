import request from 'supertest';
import authenticated from './authenticated.middleware';
import UserController from '@/resources/user/user.controller';
import App from '../app';

const app = new App([new UserController()], 3000).express;

describe('Authentication middleware', () => {
  it('should return unauthorized', async () => {
    await request(app).get('/api/user').expect(401);
  });
});