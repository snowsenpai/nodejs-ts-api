import AuthService from './auth.service';
import UserService from '../user/user.service';
import EmailService from '../email/email.service';
import token from '@/utils/token.util';
import { Token } from '@/utils/interfaces/token.interface';
import cryptoHelpers from '@/utils/crypto-helpers.util';
import { HttpException, HttpStatus } from '@/utils/exceptions';
import * as OTPAuth from 'otpauth';
import * as QRCOde from 'qrcode';
import { JsonWebTokenError } from 'jsonwebtoken';
import { hash, compare } from 'bcrypt';
import { PassThrough } from 'stream';
import { sampleFullUser, password } from 'tests/sample-data';

// prevent an open handle from pino.transport
jest.mock('pino');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('login', () => {
    it('should retun an accessToken and the otpEnabled status of a valid user', async () => {
      const userServiceSpy = jest
        .spyOn(UserService.prototype, 'getFullUserByEmail')
        // @ts-ignore
        .mockResolvedValue({
          ...sampleFullUser,
          isValidPassword: jest.fn().mockResolvedValue(true),
        });

      const mAccessToken = { expiresIn: 123, token: 'newAccessToken' };
      const createTokenSpy = jest.spyOn(token, 'createToken').mockReturnValue(mAccessToken);

      const result = await authService.login(sampleFullUser.email, password);

      const validPasswordSpy = (await userServiceSpy.mock.results[0].value).isValidPassword;
      const validPasswordSpyResult = await validPasswordSpy.mock.results[0].value;

      expect(userServiceSpy).toHaveBeenCalledWith(sampleFullUser.email);
      expect(validPasswordSpy).toHaveBeenCalledWith(password);
      expect(validPasswordSpyResult).toBe(true);
      expect(createTokenSpy).toHaveBeenCalledWith({ id: sampleFullUser._id });
      expect(result).toEqual({
        accessToken: mAccessToken,
        userOtpEnabled: sampleFullUser.otpEnabled,
      });
    });

    it('should throw an if an incorrect password is given', async () => {
      const userServiceSpy = jest
        .spyOn(UserService.prototype, 'getFullUserByEmail')
        // @ts-ignore
        .mockResolvedValue({
          ...sampleFullUser,
          isValidPassword: jest.fn().mockResolvedValue(false),
        });
      const createTokenSpy = jest.spyOn(token, 'createToken');

      await expect(authService.login(sampleFullUser.email, 'invalid password')).rejects.toThrow(
        new HttpException(HttpStatus.UNAUTHORIZED, 'wrong credentials'),
      );

      const isValidPasswordSpy = (await userServiceSpy.mock.results[0].value).isValidPassword;
      const isValidPasswordSpyResult = await isValidPasswordSpy.mock.results[0].value;

      expect(isValidPasswordSpy).toHaveBeenCalledWith('invalid password');
      expect(isValidPasswordSpyResult).toBe(false);
      expect(createTokenSpy).not.toHaveBeenCalled();
    });
  });

  describe('OTP logic', () => {
    describe('generateOTP', () => {
      it('should update a user record with a random base32 secret and an otpAuthUrl', async () => {
        const otpAuthTOTPSpy = jest
          .spyOn(OTPAuth.TOTP.prototype, 'toString')
          .mockReturnValue('newauthURLstring');

        const generateTOTPSpy = jest.spyOn(AuthService.prototype, 'generateTOTP');

        const testUser = {
          ...sampleFullUser,
          verified: true,
        };
        const getFullUserByIdSpy = jest
          .spyOn(UserService.prototype, 'getFullUserById')
          // @ts-ignore
          .mockResolvedValue(testUser);
        const cryptoHelperSpy = jest
          .spyOn(cryptoHelpers, 'generateRandomBase32')
          .mockReturnValue('newbase32string');

        const result = await authService.generateOTP(testUser._id);

        expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
        expect(cryptoHelperSpy).toHaveBeenCalledWith(24);
        expect(generateTOTPSpy).toHaveBeenCalledWith('newbase32string', testUser.email);
        expect(otpAuthTOTPSpy).toHaveBeenCalled();
        expect(testUser.otpAuthUrl).toBe('newauthURLstring');
        expect(testUser.otpBase32).toBe('newbase32string');
        expect(testUser.save).toHaveBeenCalled();
        expect(result).toEqual({
          otpUrl: 'newauthURLstring',
          base32Secret: 'newbase32string',
        });
      });

      it('should prevent unverified users from enabling otp', async () => {
        const otpAuthTOTPSpy = jest.spyOn(OTPAuth.TOTP.prototype, 'toString');

        const generateTOTPSpy = jest.spyOn(AuthService.prototype, 'generateTOTP');

        const testUser = {
          ...sampleFullUser,
        };
        const getFullUserByIdSpy = jest
          .spyOn(UserService.prototype, 'getFullUserById')
          // @ts-ignore
          .mockResolvedValue(testUser);
        const cryptoHelperSpy = jest.spyOn(cryptoHelpers, 'generateRandomBase32');

        await expect(authService.generateOTP(testUser._id)).rejects.toThrow(
          new HttpException(HttpStatus.NOT_FOUND, 'only verified users can enable OTP'),
        );
        expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
        expect(cryptoHelperSpy).not.toHaveBeenCalled();
        expect(generateTOTPSpy).not.toHaveBeenCalled();
        expect(otpAuthTOTPSpy).not.toHaveBeenCalled();
      });
    });

    describe('verifyOTP', () => {
      it("should verify a 6 digit otp string, update a user's otp status and generate recovery codes", async () => {
        const testUser = {
          ...sampleFullUser,
          verified: true,
          otpBase32: 'base32Secret',
        };
        const generateTOTPSpy = jest.spyOn(AuthService.prototype, 'generateTOTP');
        const otpAuthTOTPSpy = jest.spyOn(OTPAuth.TOTP.prototype, 'validate').mockReturnValue(1);

        const mRandStrings = ['foo', 'bar', 'baz'];
        const cryptoHelperSpy = jest
          .spyOn(cryptoHelpers, 'randomStringArray')
          .mockReturnValue(mRandStrings);
        const mHashedRandSrings = [
          { hash: 'hashedFoo', used: false },
          { hash: 'hashedBar', used: false },
          { hash: 'hashedBaz', used: false },
        ];
        const hashRecoveryCodesSpy = jest
          .spyOn(AuthService.prototype, 'hashRecoveryCodes')
          .mockResolvedValue(mHashedRandSrings);
        const getFullUserByIdSpy = jest
          .spyOn(UserService.prototype, 'getFullUserById')
          // @ts-ignore
          .mockResolvedValue({
            ...testUser,
            save: jest.fn().mockResolvedValue({
              ...testUser,
              otpEnabled: true,
              otpVerified: true,
              recoveryCodes: mHashedRandSrings,
            }),
          });

        const token = '123456';
        const result = await authService.verifyOTP(testUser._id, token);
        const modifiedUser = await getFullUserByIdSpy.mock.results[0].value;

        expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
        expect(generateTOTPSpy).toHaveBeenCalledWith(testUser.otpBase32, testUser.email);
        expect(otpAuthTOTPSpy).toHaveBeenCalledWith({ token });
        expect(cryptoHelperSpy).toHaveBeenCalledWith(8, 10);
        expect(hashRecoveryCodesSpy).toHaveBeenCalledWith(mRandStrings);
        expect(modifiedUser.save).toHaveBeenCalled();
        expect(modifiedUser.recoveryCodes).toEqual(mHashedRandSrings);
        expect(modifiedUser.otpEnabled).toBe(true);
        expect(modifiedUser.otpVerified).toBe(true);
        expect(result).toEqual({
          otpVerified: modifiedUser.otpVerified,
          user: {
            id: modifiedUser._id,
            firstName: modifiedUser.firstName,
            email: modifiedUser.email,
            otpEnabled: modifiedUser.otpEnabled,
          },
          recoveryCodes: mRandStrings,
        });
      });

      it.only('should throw an error if otp is sent after time limit', async () => {
        const testUser = {
          ...sampleFullUser,
          verified: true,
          otpBase32: 'base32Secret',
        };
        const generateTOTPSpy = jest.spyOn(AuthService.prototype, 'generateTOTP');
        const otpAuthTOTPSpy = jest.spyOn(OTPAuth.TOTP.prototype, 'validate').mockReturnValue(null);

        const getFullUserByIdSpy = jest
          .spyOn(UserService.prototype, 'getFullUserById')
          // @ts-ignore
          .mockResolvedValue(testUser);
        const cryptoHelperSpy = jest.spyOn(cryptoHelpers, 'randomStringArray');
        const hashRecoveryCodesSpy = jest.spyOn(AuthService.prototype, 'hashRecoveryCodes');

        const token = '123456';
        await expect(authService.verifyOTP(testUser._id, token)).rejects.toThrow(
          new HttpException(HttpStatus.UNAUTHORIZED, 'token is invalid or user does not exist'),
        );
        expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
        expect(generateTOTPSpy).toHaveBeenCalledWith(testUser.otpBase32, testUser.email);
        expect(otpAuthTOTPSpy).toHaveBeenCalledWith({ token });
        expect(cryptoHelperSpy).not.toHaveBeenCalled();
        expect(hashRecoveryCodesSpy).not.toHaveBeenCalled();
      });
    });

    describe('validateOTP', () => {
      //
    });
  });
});
