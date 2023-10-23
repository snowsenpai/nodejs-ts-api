import UserService from './user.service';
import UserModel from './user.model';
import EmailService from '../email/email.service';
import { HttpStatus, HttpException } from '@/utils/exceptions';
import { sampleUser, objectId, sampleFullUser, password, samplePost } from 'tests/sample-data';

// prevent an open handle from pino.transport
jest.mock('pino');

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe('register', () => {
    it('should create a new user and send welcome email', async () => {
      const existingUserSpy = jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);
      const createSpy = jest
        .spyOn(UserModel, 'create')
        // @ts-ignore
        .mockResolvedValue(sampleUser);
      const emailServiceSpy = jest
        .spyOn(EmailService.prototype, 'sendWelcomeEmail')
        // @ts-ignore
        .mockResolvedValue();

      const result = await userService.register(
        sampleUser.firstName,
        sampleUser.lastName,
        sampleUser.email,
        password,
      );

      expect(existingUserSpy).toHaveBeenCalledWith({ email: sampleUser.email });
      expect(createSpy).toHaveBeenCalledWith({
        firstName: sampleUser.firstName,
        lastName: sampleUser.lastName,
        email: sampleUser.email,
        password: password,
        role: sampleUser.role,
      });
      expect(emailServiceSpy).toHaveBeenCalledWith(sampleUser.email, sampleUser.firstName);
      expect(result).toEqual({ createdNewUserAccount: true });
    });

    it("should throw an error if a registering user's email exists", async () => {
      const error = new HttpException(HttpStatus.BAD_REQUEST, 'user already exists');
      const existingUserSpy = jest.spyOn(UserModel, 'findOne').mockResolvedValue(sampleUser);
      const createSpy = jest.spyOn(UserModel, 'create');
      const emailServiceSpy = jest.spyOn(EmailService.prototype, 'sendWelcomeEmail');

      await expect(
        userService.register(sampleUser.firstName, sampleUser.lastName, sampleUser.email, password),
      ).rejects.toThrow(error);

      expect(existingUserSpy).toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
      expect(emailServiceSpy).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of existing users', async () => {
      const modelSpy = jest.spyOn(UserModel, 'find').mockResolvedValue([sampleUser]);

      const result = await userService.findAllUsers();

      expect(modelSpy).toHaveBeenCalledWith({});
      expect(result).toEqual([sampleUser]);
    });

    it('should throw an error if no user exists', async () => {
      const modelSpy = jest.spyOn(UserModel, 'find').mockResolvedValue([]);

      await expect(userService.findAllUsers()).rejects.toThrow(
        new HttpException(HttpStatus.NOT_FOUND, 'unable to find any user'),
      );
      expect(modelSpy).toHaveBeenCalledWith({});
    });
  });

  describe('findByEmail', () => {
    it('should return a serialized user data using email as filter', async () => {
      const findOneSpy = jest
        .spyOn(UserModel, 'findOne')
        // @ts-ignore
        .mockReturnValue({
          exec: jest.fn().mockResolvedValue(sampleUser),
        });
      const result = await userService.findByEmail(sampleUser.email);

      expect(result).toEqual(sampleUser);
      expect(findOneSpy).toHaveBeenCalledWith({ email: sampleUser.email });
    });

    it('should throw an error if a user is not found when using email as filter', async () => {
      const findOneSpy = jest
        .spyOn(UserModel, 'findOne')
        // @ts-ignore
        .mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        });

      await expect(userService.findByEmail('wrong@email.com')).rejects.toThrow(
        new HttpException(HttpStatus.NOT_FOUND, 'user does not exist'),
      );
      expect(findOneSpy).toHaveBeenCalledWith({ email: 'wrong@email.com' });
    });
  });

  describe('findById', () => {
    it('should return a serialized user data using id as filter', async () => {
      const findByIdSpy = jest
        .spyOn(UserModel, 'findById')
        // @ts-ignore
        .mockResolvedValue(sampleUser);
      const result = await userService.findById(sampleUser._id);

      expect(result).toEqual(sampleUser);
      expect(findByIdSpy).toHaveBeenCalledWith(sampleUser._id);
    });

    it('should throw an error if a user is not found when using id as filter', async () => {
      const findByIdSpy = jest.spyOn(UserModel, 'findById').mockResolvedValue(null);

      await expect(userService.findById(objectId)).rejects.toThrow(
        new HttpException(HttpStatus.NOT_FOUND, 'unable to find user'),
      );
      expect(findByIdSpy).toHaveBeenCalledWith(objectId);
    });
  });

  describe('getFullUserById', () => {
    it('should return the full user data with sensitive fields using id filter', async () => {
      const findByIdSpy = jest
        .spyOn(UserModel, 'findById')
        // @ts-ignore
        .mockReturnValue({
          select: jest.fn().mockResolvedValue(sampleFullUser),
        });

      const result = await userService.getFullUserById(sampleUser._id);

      const selectSpy = findByIdSpy.mock.results[0].value.select;

      expect(result).toEqual(sampleFullUser);
      expect(findByIdSpy).toHaveBeenCalledWith(sampleUser._id);
      expect(selectSpy).toHaveBeenCalledWith(userService['sensitiveUserFields']);
    });

    it('should throw an error if a user is not found by id', async () => {
      const findByIdSpy = jest
        .spyOn(UserModel, 'findById')
        // @ts-ignore
        .mockReturnValue({
          select: jest.fn().mockResolvedValue(null),
        });

      await expect(userService.getFullUserById(objectId)).rejects.toThrow(
        new HttpException(HttpStatus.NOT_FOUND, 'user not found'),
      );
      expect(findByIdSpy).toHaveBeenCalledWith(objectId);
    });
  });

  describe('getFullUserByEmail', () => {
    it('should return the full user data with sensitive fields using email filter', async () => {
      const findOneSpy = jest
        .spyOn(UserModel, 'findOne')
        // @ts-ignore
        .mockReturnValue({
          select: jest.fn().mockResolvedValue(sampleFullUser),
        });

      const result = await userService.getFullUserByEmail(sampleUser.email);

      const selectSpy = findOneSpy.mock.results[0].value.select;

      expect(result).toEqual(sampleFullUser);
      expect(findOneSpy).toHaveBeenCalledWith({ email: sampleUser.email });
      expect(selectSpy).toHaveBeenCalledWith(userService['sensitiveUserFields']);
    });

    it('should throw an error if a user is not found by email', async () => {
      const findOneSpy = jest
        .spyOn(UserModel, 'findOne')
        // @ts-ignore
        .mockReturnValue({
          select: jest.fn().mockResolvedValue(null),
        });

      await expect(userService.getFullUserByEmail('invalid@email.com')).rejects.toThrow(
        new HttpException(HttpStatus.NOT_FOUND, 'user not found'),
      );
      expect(findOneSpy).toHaveBeenCalledWith({ email: 'invalid@email.com' });
    });
  });

  describe('updateUser', () => {
    it('should update an existing user record and return updated record', async () => {
      const newData = { firstName: 'new UserName' };
      const updateSpy = jest.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue({
        ...sampleUser,
        ...newData,
      });

      const result = await userService.updateUser(sampleUser._id, newData);

      expect(updateSpy).toHaveBeenCalledWith(sampleUser._id, newData, { new: true });
      expect(result.firstName).toEqual(newData.firstName);
    });

    it('should throw an error if a user to be updated is not found', async () => {
      const newData = { firstName: 'new UserName' };
      const updateSpy = jest.spyOn(UserModel, 'findByIdAndUpdate').mockResolvedValue(null);

      await expect(userService.updateUser(objectId, newData)).rejects.toThrow(
        new HttpException(HttpStatus.NOT_FOUND, 'user not found'),
      );
      expect(updateSpy).toHaveBeenCalledWith(objectId, newData, { new: true });
    });
  });

  describe('deleteUser', () => {
    it('should delete an existing user record and return a confirmation object', async () => {
      const deleteSpy = jest.spyOn(UserModel, 'findByIdAndDelete').mockResolvedValue(sampleUser);

      const result = await userService.deleteUser(sampleUser._id);

      expect(deleteSpy).toHaveBeenCalledWith(sampleUser._id);
      expect(result).toEqual({ deletedUserData: true });
    });

    it('should throw an error if a user to be deleted is not found', async () => {
      const deleteSpy = jest.spyOn(UserModel, 'findByIdAndDelete').mockResolvedValue(null);

      await expect(userService.deleteUser(objectId)).rejects.toThrow(
        new HttpException(HttpStatus.NOT_FOUND, 'user not found'),
      );
      expect(deleteSpy).toHaveBeenCalledWith(objectId);
    });
  });

  describe('getAllPostsOfUser', () => {
    it('should populate the posts filed of an existing user', async () => {
      const findByIdSpy = jest
        .spyOn(UserService.prototype, 'findById')
        // @ts-ignore
        .mockResolvedValue({
          ...sampleUser,
          populate: jest.fn().mockReturnValue({ ...sampleUser, posts: [samplePost] }),
        });

      const result = await userService.getAllPostsOfUser(sampleUser._id);
      const populateSpy = (await findByIdSpy.mock.results[0].value).populate;

      expect(findByIdSpy).toHaveBeenCalledWith(sampleUser._id);
      expect(populateSpy).toHaveBeenCalledWith('posts');
      // @ts-ignore
      expect(result.posts).toEqual([samplePost]);
    });
  });
});
