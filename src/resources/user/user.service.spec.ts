import UserService from "./user.service";
import UserController from "./user.controller";
import request from 'supertest';
import App from "../../app";

const app = new App([new UserController()], 3000).express;

describe('User Service', () => {
  const newUser = {
    name: 'bob',
    email: 'test@test.com',
    password: 'testing',
    role: 'user'
  };

  const message = {message: 'User created'};

  it('should register a new user', async () => {
    const mockService = jest.spyOn(UserService.prototype, 'register')
      // @ts-ignore
      .mockReturnValueOnce(message);
    const res = await request(app).post('/api/user/register').send(newUser);
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(message);
    expect(mockService).toHaveBeenCalled();
  });

  it('should return a login token',async () => {
    const mockService = jest.spyOn(UserService.prototype, 'login')
      // @ts-ignore
      .mockReturnValueOnce(newUser);
    
    const res = await request(app).post('/api/user/login').send(newUser);
    
      expect(res.statusCode).toBe(200);
    expect(mockService).toHaveBeenCalled();
  });
});
