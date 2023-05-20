import request from 'supertest';
import App from '../../app';
import UserController from './user.controller';

const app = new App([new UserController()], 3000).express;

const registerUser = {
  name: 'testuser',
  email: 'test@email.com',
  password: 'donkey'
};

const message = {message: 'User created'};

describe('User controller .api/user', () => {
  it('should register a user', async () => {
    const mockUserController = jest.spyOn(UserController.prototype as any, 'register')
      .mockReturnValueOnce(message);

    const { body,statusCode } = await request(app).post('/api/user/register')
      .send(registerUser);
    console.log(body);
    
    expect(statusCode).toBe(201);
    expect(body.name).toEqual(registerUser.name);
    expect(mockUserController).toHaveBeenCalled();
  });
});
