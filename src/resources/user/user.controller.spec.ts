import userController from './user.controller';
import UserService from './user.service';
import { HttpStatus, HttpException } from '@/utils/exceptions';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { sampleUser, password, objectId, samplePost } from 'tests/sample-data';

// prevent an open handle from pino.transport
jest.mock('pino');

describe('UserController', () => {
  describe('register', () => {
    it('should call UserService register method and return 201', async () => {
      const req = getMockReq({
        body: {
          firstName: 'Test',
          lastName: 'User',
          email: 'user@test.com',
          password: 'newPassword',
        },
      });
      const { res, next } = getMockRes();
      const registerSpy = jest.spyOn(userController, 'register');

      const newUser = { ...sampleUser, password };
      const serviceSpy = jest
        .spyOn(UserService.prototype, 'register')
        // @ts-ignore
        .mockResolvedValue(newUser);

      await userController.register(req, res, next);

      expect(registerSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith('Test', 'User', 'user@test.com', 'newPassword');
      expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'user account created successfully',
          data: newUser,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if an error occurs', async () => {
      const req = getMockReq();
      const { res, next } = getMockRes();
      const registerSpy = jest.spyOn(userController, 'register');

      const error = new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'things exploded?');
      const serviceSpy = jest
        .spyOn(UserService.prototype, 'register')
        // @ts-ignore
        .mockRejectedValue(error);

      await userController.register(req, res, next);

      expect(registerSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalled();
      expect(serviceSpy).rejects.toThrow(error);
      expect(res.status).not.toBeCalled();
      expect(res.json).not.toBeCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getUser', () => {
    it('should return 200 with user data if user exist in req', () => {
      const req = getMockReq({
        user: sampleUser,
      });
      const { res, next } = getMockRes();
      const getUserSpy = jest.spyOn(userController, 'getUser');

      userController.getUser(req, res, next);

      expect(getUserSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'user data retrieved',
          data: sampleUser,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('findUser', () => {
    it('should respond with 200 and a retrieved user object', async () => {
      const req = getMockReq({
        params: {
          id: sampleUser._id,
        },
      });
      const { res, next } = getMockRes();
      const findOneSpy = jest.spyOn(userController, 'findUser');

      const serviceSpy = jest
        .spyOn(UserService.prototype, 'findById')
        // @ts-ignore
        .mockResolvedValue(sampleUser);

      await userController.findUser(req, res, next);

      expect(findOneSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'user data retrieved',
          data: sampleUser,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if an error occurs', async () => {
      const req = getMockReq({
        params: {
          id: objectId,
        },
      });
      const { res, next } = getMockRes();
      const findOneSpy = jest.spyOn(userController, 'findUser');

      const error = new HttpException(HttpStatus.NOT_FOUND, 'unable to find user');
      const serviceSpy = jest
        .spyOn(UserService.prototype, 'findById')
        // @ts-ignore
        .mockRejectedValue(error);

      await userController.findUser(req, res, next);

      expect(findOneSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith(objectId);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateUser', () => {
    it("should update an existing user's firstName and or lastName", async () => {
      const newData = { firstName: 'Bob' };
      const req = getMockReq({
        user: sampleUser,
        body: newData,
      });
      const { res, next } = getMockRes();
      const updateSpy = jest.spyOn(userController, 'updateUser');

      const updatedUser = { ...sampleUser, ...newData };
      const serviceSpy = jest
        .spyOn(UserService.prototype, 'updateUser')
        // @ts-ignore
        .mockResolvedValue(updatedUser);

      await userController.updateUser(req, res, next);

      expect(updateSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id, newData);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'user updated successfully',
          data: updatedUser,
        }),
      );
    });

    it('should call next with HttpException is an error occurs', async () => {
      const newData = { firstName: 'Bob' };
      const req = getMockReq({
        body: newData,
      });
      const { res, next } = getMockRes();
      const updateSpy = jest.spyOn(userController, 'updateUser');

      const error = new HttpException(HttpStatus.NOT_FOUND, 'user not found');
      const serviceSpy = jest
        .spyOn(UserService.prototype, 'updateUser')
        // @ts-ignore
        .mockRejectedValue(error);

      await userController.updateUser(req, res, next);

      expect(updateSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeUndefined();
      expect(serviceSpy).toHaveBeenCalledWith(req.user?._id, newData);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('userPost', () => {
    it('should return a user object with the post field populated', async () => {
      const req = getMockReq({
        params: {
          id: sampleUser._id,
        },
      });
      const { res, next } = getMockRes();
      const userPostSpy = jest.spyOn(userController, 'userPost');

      const populatedPost = { ...sampleUser, posts: [samplePost] };
      const serviceSpy = jest
        .spyOn(UserService.prototype, 'getAllPostsOfUser')
        // @ts-ignore
        .mockResolvedValue(populatedPost);

      await userController.userPost(req, res, next);

      expect(userPostSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'user post field populated',
          data: populatedPost,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete an existing user data and return a confirmation message', async () => {
      const req = getMockReq({
        user: sampleUser,
      });
      const { res, next } = getMockRes();

      const deleteSpy = jest.spyOn(userController, 'deleteUser');

      const serviceResult = { deletedUserData: true };
      const serviceSpy = jest
        .spyOn(UserService.prototype, 'deleteUser')
        .mockResolvedValue(serviceResult);

      await userController.deleteUser(req, res, next);

      expect(deleteSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id);
      expect(req.user).toBeDefined();
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'user account deleted successfully',
          data: serviceResult,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if an error occurs', async () => {
      const req = getMockReq();
      const { res, next } = getMockRes();

      const deleteSpy = jest.spyOn(userController, 'deleteUser');

      const error = new HttpException(HttpStatus.NOT_FOUND, 'user not found');
      const serviceSpy = jest.spyOn(UserService.prototype, 'deleteUser').mockRejectedValue(error);

      await userController.deleteUser(req, res, next);

      expect(deleteSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith(req.user?._id);
      expect(req.user).toBeUndefined();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
