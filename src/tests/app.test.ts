import 'dotenv/config';
import request from 'supertest';
import App from '../app';
import { connectDB, closeDB } from './mongooseTestDB';
import apiRoutes from '@/resources/index'

const app = new App(apiRoutes, 3000).express;  

const postPayload = {
  title: 'new post',
  body: 'test post sent with supertest'
};

const userInput = {
  email: 'john@test.com',
  name: 'John',
  password: 'password123',
}

const userLogin = {
  email: userInput.email,
  password: userInput.password
}

// existing test user in db
const userPayload = {
  _id: '6487051ff8ab20e9d872da4c',
  name: 'John',
  email: 'john@test.com',
  role: 'user',
  createdAt: new Date('2023-06-12T11:44:31.823Z').toISOString(),
  updatedAt: new Date('2023-06-12T11:44:31.823Z').toISOString(),
  __v: 0
}

let accessToken: string;

describe('Api base /api endpoint', () => {
  beforeAll(async () => {
    await connectDB();

    const { body } = await request(app).post('/api/user/login').send(userLogin);
    accessToken = body.accessToken;
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
    it('should not grant access to unauthenticated users', async () => {
      await request(app).get('/api/user').expect(401);
    });

    it('should return a user object for an authenticated user', async () => {
      const { statusCode, body } = await request(app).get('/api/user').set('Authorization', `Bearer ${accessToken}`);

      expect(statusCode).toBe(200);
      expect(body).toEqual({ data: userPayload});
    });

    // FIX: API routing moved to seperate module, spying on controller's service should be done in unit tests
    // describe('/register', () => {
    //   it('should register a new user and return a success message', async () => {
    //     const userServiceMock = jest.spyOn(userController['UserService'], 'register')
    //     .mockResolvedValue({ message: 'User created' })

    //     const { statusCode, body } = await request(app).post('/api/user/register').send(userInput);

    //     expect(statusCode).toBe(201);
    //     expect(body).toEqual({message: 'User created'});
    //     expect(userServiceMock).toHaveBeenCalled();  
    //   });

    //   it('should not register a user if UserService throws', async () => {
    //     const userServiceMock = jest.spyOn(userController['UserService'], 'register');

    //     const { statusCode, body } = await request(app).post('/api/user/register').send(userInput);
        
    //     expect(statusCode).toBe(400);
    //     expect(body).toEqual({message: 'Failed to register user', status: 400});
    //     expect(userServiceMock).toHaveBeenCalled();
    //   });
    // });
    
    // FIX: login logic moved to auth resource
    // describe('/login', () => {
    //   it('should return an accessToken for a registered user', async () => {
    //     const jwtToken = {
    //       token: 'login token',
    //       expiresIn: 10
    //     }
    //     const userServiceMock = jest.spyOn(userController['UserService'], 'login')
    //     .mockResolvedValue(jwtToken);

    //     const { statusCode, body } = await request(app).post('/api/auth/login').send(userLogin);
        
    //     expect(statusCode).toBe(200);
    //     expect(body).toEqual({accessToken: jwtToken});
    //     expect(userServiceMock).toHaveBeenCalledWith(userLogin.email, userLogin.password);
    //   });
    // });

  });
});
