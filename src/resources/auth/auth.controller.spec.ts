import authController from './auth.controller';
import AuthService from './auth.service';
import { HttpException, HttpStatus } from '@/utils/exceptions';
import { getMockReq, getMockRes } from '@jest-mock/express';
import { password, sampleUser } from 'tests/sample-data';

jest.mock('pino');

const fullUrl = 'http:/fullUrl.test';

describe('AuthController', () => {
  describe('login', () => {
    it('should call respond with 200 and an access token for a registered user', async () => {
      const req = getMockReq({
        body: {
          email: sampleUser.email,
          password,
        },
      });
      const { res, next } = getMockRes();
      const loginSpy = jest.spyOn(authController, 'login');

      const mockAccessToken = {
        token: 'accessToken',
        expiresIn: 10000,
      };
      const serviceSpy = jest.spyOn(AuthService.prototype, 'login').mockResolvedValue({
        accessToken: mockAccessToken,
        userOtpEnabled: sampleUser.otpEnabled,
      });

      await authController.login(req, res, next);

      expect(loginSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser.email, password);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'login successful, use your access token to send request to protected resources',
          data: {
            accessToken: mockAccessToken,
            userOtpEnabled: sampleUser.otpEnabled,
          },
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if an error is thrown', async () => {
      const req = getMockReq();
      const { res, next } = getMockRes();
      const loginSpy = jest.spyOn(authController, 'login');

      const error = new HttpException(HttpStatus.NOT_FOUND, 'user not found');
      const serviceSpy = jest.spyOn(AuthService.prototype, 'login').mockRejectedValue(error);

      await authController.login(req, res, next);

      expect(loginSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith(undefined, undefined);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('generateOTP', () => {
    it('should respond with 200, otp auth url and base32Secret', async () => {
      const req = getMockReq({
        user: {
          ...sampleUser,
          verified: true,
        },
      });
      const { res, next } = getMockRes();
      const generateOTPSpy = jest.spyOn(authController, 'generateOTP');
      const mockData = {
        otpUrl: 'otpauth/url',
        base32Secret: 'base32string',
      };
      const serviceSpy = jest
        .spyOn(AuthService.prototype, 'generateOTP')
        .mockResolvedValue(mockData);
      await authController.generateOTP(req, res, next);

      expect(generateOTPSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'generated otp credentials sucessfully',
          data: mockData,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if request user is undefined', async () => {
      const req = getMockReq();
      const { res, next } = getMockRes();
      const generateOTPSpy = jest.spyOn(authController, 'generateOTP');

      const error = new HttpException(HttpStatus.NOT_FOUND, 'user not found');
      const serviceSpy = jest.spyOn(AuthService.prototype, 'generateOTP').mockRejectedValue(error);

      await authController.generateOTP(req, res, next);

      expect(generateOTPSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith(undefined);
      expect(req.user).toBeUndefined();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('verifyOTP', () => {
    it('should verify an otp and respond with recovery codes for a user', async () => {
      const token = '123456';
      const req = getMockReq({
        user: sampleUser,
        body: {
          token,
        },
      });
      const { res, next } = getMockRes();
      const verifyOTPSpy = jest.spyOn(authController, 'verifyOTP');

      const mockData = {
        otpVerified: true,
        user: {
          id: sampleUser._id,
          firstName: sampleUser.firstName,
          email: sampleUser.email,
          otpEnabled: true,
        },
        recoveryCodes: ['hashedCode0', 'hashedCode1', 'hashedCode2'],
      };
      const serviceSpy = jest.spyOn(AuthService.prototype, 'verifyOTP').mockResolvedValue(mockData);

      await authController.verifyOTP(req, res, next);

      expect(verifyOTPSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id, token);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'otp verified, two factor authentication is enabled',
          data: mockData,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if error occurs', async () => {
      const token = '';
      const req = getMockReq({
        user: sampleUser,
        body: {
          token,
        },
      });
      const { res, next } = getMockRes();
      const verifyOTPSpy = jest.spyOn(authController, 'verifyOTP');

      const error = new HttpException(
        HttpStatus.UNAUTHORIZED,
        'token is invalid or user does not exist',
      );
      const serviceSpy = jest.spyOn(AuthService.prototype, 'verifyOTP').mockRejectedValue(error);

      await authController.verifyOTP(req, res, next);

      expect(verifyOTPSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id, '');
      expect(req.user).toBeDefined();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('validateOTP', () => {
    it('should respond with 200 if a given token is valid', async () => {
      const token = '123456';
      const req = getMockReq({
        user: sampleUser,
        body: {
          token,
        },
      });
      const { res, next } = getMockRes();
      const validateOTPSpy = jest.spyOn(authController, 'validateOTP');

      const mockData = { otpValid: true };
      const serviceSpy = jest
        .spyOn(AuthService.prototype, 'validateOTP')
        .mockResolvedValue(mockData);

      await authController.validateOTP(req, res, next);

      expect(validateOTPSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id, token);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'otp is valid',
          data: mockData,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if error occurs', async () => {
      const token = '';
      const req = getMockReq({
        user: sampleUser,
        body: {
          token,
        },
      });
      const { res, next } = getMockRes();
      const validateOTPSpy = jest.spyOn(authController, 'validateOTP');

      const error = new HttpException(
        HttpStatus.UNAUTHORIZED,
        'token is invalid or user does not exist',
      );
      const serviceSpy = jest.spyOn(AuthService.prototype, 'validateOTP').mockRejectedValue(error);

      await authController.validateOTP(req, res, next);

      expect(validateOTPSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id, '');
      expect(req.user).toBeDefined();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('disableOTP', () => {
    it('should respond with 200 and disable a user`s otp status', async () => {
      const token = '123456';
      const req = getMockReq({
        user: sampleUser,
        body: {
          token,
        },
      });
      const { res, next } = getMockRes();
      const disableOTPSpy = jest.spyOn(authController, 'disableOTP');

      const mockData = {
        otpDisabled: true,
        user: {
          id: sampleUser._id,
          firstName: sampleUser.firstName,
          email: sampleUser.email,
          otpEnabled: false,
        },
      };
      const serviceSpy = jest
        .spyOn(AuthService.prototype, 'disableOTP')
        .mockResolvedValue(mockData);

      await authController.disableOTP(req, res, next);

      expect(disableOTPSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id, token);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'otp and two factor authentication disabled successfully',
          data: mockData,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if error occurs', async () => {
      const token = '';
      const req = getMockReq({
        user: sampleUser,
        body: {
          token,
        },
      });
      const { res, next } = getMockRes();
      const disableOTPSpy = jest.spyOn(authController, 'disableOTP');

      const error = new HttpException(
        HttpStatus.UNAUTHORIZED,
        'token is invalid or user does not exist',
      );
      const serviceSpy = jest.spyOn(AuthService.prototype, 'disableOTP').mockRejectedValue(error);

      await authController.disableOTP(req, res, next);

      expect(disableOTPSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id, '');
      expect(req.user).toBeDefined();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('validateRecoveryCode', () => {
    it('should respond with 200 for a valid recovery code', async () => {
      const code = 'asdfghjk';
      const req = getMockReq({
        user: sampleUser,
        body: {
          code,
        },
      });
      const { res, next } = getMockRes();
      const validateSpy = jest.spyOn(authController, 'validateRecoveryCode');

      const mockData = { validCode: true, recoveryCode: code };
      const serviceSpy = jest.spyOn(AuthService.prototype, 'validCode').mockResolvedValue(mockData);

      await authController.validateRecoveryCode(req, res, next);

      expect(validateSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id, code);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'recovery code is valid and cannot be used again',
          data: mockData,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if an error occors', async () => {
      const code = '';
      const req = getMockReq({
        user: sampleUser,
        body: {
          code,
        },
      });
      const { res, next } = getMockRes();
      const validateSpy = jest.spyOn(authController, 'validateRecoveryCode');

      const error = new HttpException(HttpStatus.NOT_FOUND, 'invalid recovery code');
      const serviceSpy = jest.spyOn(AuthService.prototype, 'validCode').mockRejectedValue(error);

      await authController.validateRecoveryCode(req, res, next);

      expect(validateSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id, '');
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('verifyEmail', () => {
    it('should respond with 200 and email verification status of a user', async () => {
      const req = getMockReq({
        user: sampleUser,
        completeUrl: fullUrl,
      });
      const { res, next } = getMockRes();
      const verifyEmailSpy = jest.spyOn(authController, 'verifyEmail');

      const mockData = {
        message: `a verification link has been sent to ${sampleUser.email}`,
        data: {
          sendVerifyEmail: true,
        },
      };
      const serviceSpy = jest
        .spyOn(AuthService.prototype, 'verifyEmail')
        .mockResolvedValue(mockData);
      await authController.verifyEmail(req, res, next);

      expect(verifyEmailSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(req.completeUrl).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id, fullUrl);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(mockData);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if an error occurs', async () => {
      const req = getMockReq({
        user: {
          ...sampleUser,
          verified: true,
        },
        completeUrl: fullUrl,
      });
      const { res, next } = getMockRes();
      const verifyEmailSpy = jest.spyOn(authController, 'verifyEmail');

      const error = new HttpException(HttpStatus.BAD_REQUEST, 'user is already verified');
      const serviceSpy = jest.spyOn(AuthService.prototype, 'verifyEmail').mockRejectedValue(error);

      await authController.verifyEmail(req, res, next);

      expect(verifyEmailSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(req.completeUrl).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id, fullUrl);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('validateEmail', () => {
    it('should respond with 200 and email verification result of a user', async () => {
      const encryptedEmail = 'definetlyEncrypted123456';
      const emailToken = '123456';
      const req = getMockReq({
        params: {
          encryptedEmail,
          emailToken,
        },
      });
      const { res, next } = getMockRes();
      const validateEmailSpy = jest.spyOn(authController, 'validateEmail');

      const mockData = {
        email: sampleUser.email,
        emailVerified: sampleUser.verified,
      };
      const serviceSpy = jest
        .spyOn(AuthService.prototype, 'validateEmail')
        .mockResolvedValue(mockData);

      await authController.validateEmail(req, res, next);

      expect(validateEmailSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith(encryptedEmail, emailToken);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'email account verified successfully',
          data: mockData,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if an error occurs', async () => {
      const encryptedEmail = 'definetlyEncrypted123456';
      const emailToken = '';
      const req = getMockReq({
        params: {
          encryptedEmail,
          emailToken,
        },
      });
      const { res, next } = getMockRes();
      const validateEmailSpy = jest.spyOn(authController, 'validateEmail');

      const error = new HttpException(
        HttpStatus.BAD_REQUEST,
        'verification failed, possibly link is invalid or expired',
      );
      const serviceSpy = jest
        .spyOn(AuthService.prototype, 'validateEmail')
        .mockRejectedValue(error);

      await authController.validateEmail(req, res, next);

      expect(validateEmailSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith(encryptedEmail, emailToken);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('passwordResetRequest', () => {
    it('should respond with 200 and password reset status of a user', async () => {
      const req = getMockReq({
        user: {
          ...sampleUser,
          verified: true,
        },
        completeUrl: fullUrl,
      });
      const { res, next } = getMockRes();
      const passwordResetSpy = jest.spyOn(authController, 'passwordResetRequest');

      const mockData = { sendPasswordResetEmail: true };
      const serviceSpy = jest
        .spyOn(AuthService.prototype, 'passwordResetRequest')
        .mockResolvedValue(mockData);

      await authController.passwordResetRequest(req, res, next);

      expect(passwordResetSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id, fullUrl);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'a password reset email has been sent',
          data: mockData,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if an error occurs', async () => {
      const req = getMockReq({
        user: sampleUser,
        completeUrl: fullUrl,
      });
      const { res, next } = getMockRes();
      const passwordResetSpy = jest.spyOn(authController, 'passwordResetRequest');

      const error = new HttpException(
        HttpStatus.NOT_FOUND,
        'only verified users can reset their password',
      );
      const serviceSpy = jest
        .spyOn(AuthService.prototype, 'passwordResetRequest')
        .mockRejectedValue(error);

      await authController.passwordResetRequest(req, res, next);

      expect(passwordResetSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id, fullUrl);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('validatePasswordReset', () => {
    it('should respond with 200 and validate a user`s password reset request', async () => {
      const encryptedEmail = 'definetlyEncrypted123456';
      const passwordToken = '123456';
      const req = getMockReq({
        params: {
          encryptedEmail,
          passwordToken,
        },
      });
      const { res, next } = getMockRes();
      const validatePasswordSpy = jest.spyOn(authController, 'validatePasswordReset');

      const mockData = { grantPasswordReset: true, passwordToken: '123456' };
      const serviceSpy = jest
        .spyOn(AuthService.prototype, 'validatePasswordReset')
        .mockResolvedValue(mockData);

      await authController.validatePasswordReset(req, res, next);

      expect(validatePasswordSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith(encryptedEmail, passwordToken);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'password reset permission granted',
          data: mockData,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if an error occurs', async () => {
      const encryptedEmail = 'definetlyEncrypted123456';
      const passwordToken = '';
      const req = getMockReq({
        params: {
          encryptedEmail,
          passwordToken,
        },
      });
      const { res, next } = getMockRes();
      const validatePasswordSpy = jest.spyOn(authController, 'validatePasswordReset');

      const error = new HttpException(
        HttpStatus.BAD_REQUEST,
        'verification failed, possibly link is invalid or expired',
      );
      const serviceSpy = jest
        .spyOn(AuthService.prototype, 'validatePasswordReset')
        .mockRejectedValue(error);

      await authController.validatePasswordReset(req, res, next);

      expect(validatePasswordSpy).toHaveBeenCalledWith(req, res, next);
      expect(serviceSpy).toHaveBeenCalledWith(encryptedEmail, passwordToken);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('resetPassword', () => {
    it('should respond with 200 and verify password reset success', async () => {
      const newPassword = 'plainPassword';
      const passwordToken = '123456';
      const req = getMockReq({
        user: sampleUser,
        passwordResetSecret: passwordToken,
        body: {
          newPassword,
        },
      });
      const { res, next } = getMockRes();
      const resetPasswordSpy = jest.spyOn(authController, 'resetPassword');

      const mockData = { successfulPasswordReset: true };
      const serviceSpy = jest
        .spyOn(AuthService.prototype, 'resetPassword')
        .mockResolvedValue(mockData);

      await authController.resetPassword(req, res, next);

      expect(resetPasswordSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(req.passwordResetSecret).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id, passwordToken, newPassword);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'password reset successful, please login with your new credentials',
          data: mockData,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if an error occurs', async () => {
      const newPassword = 'oldPassword';
      const passwordToken = '';
      const req = getMockReq({
        user: sampleUser,
        passwordResetSecret: passwordToken,
        body: {
          newPassword,
        },
      });
      const { res, next } = getMockRes();
      const resetPasswordSpy = jest.spyOn(authController, 'resetPassword');

      const error = new HttpException(
        HttpStatus.BAD_REQUEST,
        'password reset failed, user not verified or has no permission to reset password',
      );
      const serviceSpy = jest
        .spyOn(AuthService.prototype, 'resetPassword')
        .mockRejectedValue(error);

      await authController.resetPassword(req, res, next);

      expect(resetPasswordSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(req.passwordResetSecret).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id, passwordToken, newPassword);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('cancelPasswordReset', () => {
    it('should respond with 200 and password reset cancelation status of a user', async () => {
      const passwordToken = '123456';
      const req = getMockReq({
        user: sampleUser,
        passwordResetSecret: passwordToken,
      });
      const { res, next } = getMockRes();
      const cancelPasswordSpy = jest.spyOn(authController, 'cancelPasswordReset');

      const mockData = { passwordResetCanceled: true };
      const serviceSpy = jest
        .spyOn(AuthService.prototype, 'cancelPasswordReset')
        .mockResolvedValue(mockData);

      await authController.cancelPasswordReset(req, res, next);

      expect(cancelPasswordSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(req.passwordResetSecret).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id, passwordToken);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'password reset has been canceled',
          data: mockData,
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if an error occurs', async () => {
      const passwordToken = '';
      const req = getMockReq({
        user: sampleUser,
        passwordResetSecret: passwordToken,
      });
      const { res, next } = getMockRes();
      const cancelPasswordSpy = jest.spyOn(authController, 'cancelPasswordReset');

      const error = new HttpException(
        HttpStatus.BAD_REQUEST,
        'password reset request not recived or permission not granted',
      );
      const serviceSpy = jest
        .spyOn(AuthService.prototype, 'cancelPasswordReset')
        .mockRejectedValue(error);

      await authController.cancelPasswordReset(req, res, next);

      expect(cancelPasswordSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(req.passwordResetSecret).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id, passwordToken);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateEmail', () => {
    it('should respond with 200 and email update status of a user', async () => {
      const newEmail = 'newEmail@test.com';
      const req = getMockReq({
        user: sampleUser,
        completeUrl: fullUrl,
        body: {
          newEmail,
        },
      });
      const { res, next } = getMockRes();
      const updateEmailSpy = jest.spyOn(authController, 'updateEmail');

      const mockData = {
        message: 'your email has been updated',
        data: {
          emailUpdated: true,
          newEmail: sampleUser.email,
          verifiedEmail: sampleUser.verified,
        },
      };
      const serviceSpy = jest
        .spyOn(AuthService.prototype, 'updateEmail')
        // @ts-ignore
        .mockResolvedValue(mockData);

      await authController.updateEmail(req, res, next);

      expect(updateEmailSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(req.completeUrl).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(sampleUser._id, sampleUser.email, newEmail, fullUrl);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith(mockData);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with HttpException if an error occurs', async () => {
      const newEmail = sampleUser.email;
      const req = getMockReq({
        user: sampleUser,
        completeUrl: fullUrl,
        body: {
          newEmail,
        },
      });
      const { res, next } = getMockRes();
      const updateEmailSpy = jest.spyOn(authController, 'updateEmail');

      const error = new HttpException(
        HttpStatus.BAD_REQUEST,
        'new email should not be the same as old email',
      );
      const serviceSpy = jest.spyOn(AuthService.prototype, 'updateEmail').mockRejectedValue(error);

      await authController.updateEmail(req, res, next);

      expect(updateEmailSpy).toHaveBeenCalledWith(req, res, next);
      expect(req.user).toBeDefined();
      expect(req.completeUrl).toBeDefined();
      expect(serviceSpy).toHaveBeenCalledWith(
        sampleUser._id,
        sampleUser.email,
        sampleUser.email,
        fullUrl,
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
