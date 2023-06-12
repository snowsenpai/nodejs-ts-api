import token from "@/utils/token";

// Mock token.createToken
jest.mock('../../utils/token');

import UserService from "./user.service";
import UserModel from "./user.model";
// Mock User Model
jest.mock('./user.model', () => {
  return {
    create: jest.fn(),
    findOne: jest.fn(),
  };
});

describe('UserService', () => {
  let userService: UserService;
  let mockUserModel: jest.Mocked<typeof UserModel>;
  
  const name = 'bob';
  const email = 'test@test.com';
  const password = 'testing';
  const role = 'user';

  beforeEach(() => {
    userService = new UserService();
    mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
    token.createToken = jest.fn().mockReturnValue('mockedToken');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user', async () => {
      await userService.register(name, email, password, role);

      expect(mockUserModel.create).toHaveBeenCalledWith({
        name, 
        email, 
        password,
         role,
      });
    });
    
    it('should throw an error if register fails', async () => {
      //TODO check the message passed to new DataBaseError()
      const errorMessage = 'Failed to register user';
      mockUserModel.create.mockRejectedValueOnce(new Error(errorMessage));

      await expect(async () => {
        await userService.register(name, email, password, role);
      }).rejects.toThrowError(errorMessage);
    });
  });

  describe('login', () => {
    it('should generate a token for a valid user', async () => {
      const mockUser = {
        isValidPassword: jest.fn().mockResolvedValue(true),
      }
      mockUserModel.findOne.mockResolvedValue(mockUser);
      

      const result = await userService.login(email, password);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({email});
      expect(mockUser.isValidPassword).toHaveBeenCalledWith(password);
      expect(token.createToken).toHaveBeenCalledWith(mockUser);
      expect(result).toBe('mockedToken');
    });

    it('should throw an error for invalid credentials', async () => {
      const mockUser = {
        isValidPassword: jest.fn().mockResolvedValue(false),
      }
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const errorMessage = 'Wrong credentials';

      await expect(userService.login(email, password)).rejects.toThrow(errorMessage);

    });

    it('should throw an error if user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const errorMessage = 'Unable to find user with that email';

      await expect(userService.login(email, password)).rejects.toThrow(errorMessage);
    });

    it('should throw an error if login fails', async () => {
      const errorMessage = 'Database error';
      mockUserModel.findOne.mockRejectedValueOnce(new Error(errorMessage));

      await expect(userService.login(email, password)).rejects.toThrow(errorMessage);
    });
  });
});
