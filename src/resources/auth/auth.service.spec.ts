import AuthService from './auth.service';
import UserService from '../user/user.service';
import EmailService from '../email/email.service';
import token from '@/utils/token.util';
import cryptoHelpers from '@/utils/crypto-helpers.util';
import { HttpException, HttpStatus } from '@/utils/exceptions';
import * as OTPAuth from 'otpauth';
import { JsonWebTokenError } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { sampleFullUser, password, sampleUser } from 'tests/sample-data';

// prevent an open handle from pino.transport
jest.mock('pino');

jest.mock('@sendgrid/mail');
jest.mock('otpauth');
jest.mock('bcrypt');

const fullUrl = 'http:/fullUrl.test';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('login', () => {
    it('should return an accessToken and the otpEnabled status of a valid user', async () => {
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
          new HttpException(HttpStatus.UNAUTHORIZED, 'only verified users can enable OTP'),
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
        const mHashedRandStrings = [
          { hash: 'hashedFoo', used: false },
          { hash: 'hashedBar', used: false },
          { hash: 'hashedBaz', used: false },
        ];
        const hashRecoveryCodesSpy = jest
          .spyOn(AuthService.prototype, 'hashRecoveryCodes')
          .mockResolvedValue(mHashedRandStrings);
        const getFullUserByIdSpy = jest
          .spyOn(UserService.prototype, 'getFullUserById')
          // @ts-ignore
          .mockResolvedValue({
            ...testUser,
            save: jest.fn().mockResolvedValue({
              ...testUser,
              otpEnabled: true,
              otpVerified: true,
              recoveryCodes: mHashedRandStrings,
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
        expect(modifiedUser.recoveryCodes).toEqual(mHashedRandStrings);
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

      it('should throw an error if token validation returns null', async () => {
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
          new HttpException(HttpStatus.UNAUTHORIZED, 'token is invalid'),
        );
        expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
        expect(generateTOTPSpy).toHaveBeenCalledWith(testUser.otpBase32, testUser.email);
        expect(otpAuthTOTPSpy).toHaveBeenCalledWith({ token });
        expect(cryptoHelperSpy).not.toHaveBeenCalled();
        expect(hashRecoveryCodesSpy).not.toHaveBeenCalled();
      });
    });

    describe('validateOTP', () => {
      it('should validate subsequent tokens after otp is enabled for a user', async () => {
        const testUser = {
          ...sampleFullUser,
          verified: true,
          otpBase32: 'base32Secret',
          otpEnabled: true,
          otpVerified: true,
        };
        const generateTOTPSpy = jest.spyOn(AuthService.prototype, 'generateTOTP');
        const otpAuthTOTPSpy = jest.spyOn(OTPAuth.TOTP.prototype, 'validate').mockReturnValue(1);

        const getFullUserByIdSpy = jest
          .spyOn(UserService.prototype, 'getFullUserById')
          // @ts-ignore
          .mockResolvedValue(testUser);
        const token = '123456';

        const result = await authService.validateOTP(testUser._id, token);

        expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
        expect(generateTOTPSpy).toHaveBeenCalledWith(testUser.otpBase32, testUser.email);
        expect(otpAuthTOTPSpy).toHaveBeenCalledWith({ token, window: 1 });
        expect(result).toEqual({ otpValid: true });
      });

      it('should throw an error if token validation returns null', async () => {
        const testUser = {
          ...sampleFullUser,
          verified: true,
          otpBase32: 'base32Secret',
          otpEnabled: true,
          otpVerified: true,
        };
        const generateTOTPSpy = jest.spyOn(AuthService.prototype, 'generateTOTP');
        const otpAuthTOTPSpy = jest.spyOn(OTPAuth.TOTP.prototype, 'validate').mockReturnValue(null);

        const getFullUserByIdSpy = jest
          .spyOn(UserService.prototype, 'getFullUserById')
          // @ts-ignore
          .mockResolvedValue(testUser);
        const token = '123456';

        await expect(authService.validateOTP(testUser._id, token)).rejects.toThrow(
          new HttpException(HttpStatus.UNAUTHORIZED, 'token is invalid'),
        );

        expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
        expect(generateTOTPSpy).toHaveBeenCalledWith(testUser.otpBase32, testUser.email);
        expect(otpAuthTOTPSpy).toHaveBeenCalledWith({ token, window: 1 });
      });
    });

    describe('disableOTP', () => {
      it('should reset otp related data of a user', async () => {
        const testUser = {
          ...sampleFullUser,
          verified: true,
          otpBase32: 'base32Secret',
          otpEnabled: true,
          otpVerified: true,
        };
        const generateTOTPSpy = jest.spyOn(AuthService.prototype, 'generateTOTP');
        const otpAuthTOTPSpy = jest.spyOn(OTPAuth.TOTP.prototype, 'validate').mockReturnValue(1);

        const getFullUserByIdSpy = jest
          .spyOn(UserService.prototype, 'getFullUserById')
          // @ts-ignore
          .mockResolvedValue({
            ...testUser,
            save: jest.fn().mockResolvedValue({
              ...testUser,
              otpEnabled: false,
              otpVerified: false,
              otpBase32: '',
              otpAuthUrl: '',
            }),
          });
        const token = '123456';

        const result = await authService.disableOTP(testUser._id, token);
        const modifiedUser = await getFullUserByIdSpy.mock.results[0].value;

        expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
        expect(generateTOTPSpy).toHaveBeenCalledWith(testUser.otpBase32, testUser.email);
        expect(otpAuthTOTPSpy).toHaveBeenCalledWith({ token, window: 1 });
        expect(modifiedUser.save).toHaveBeenCalled();
        expect(modifiedUser.otpEnabled).toBe(false);
        expect(modifiedUser.otpVerified).toBe(false);
        expect(modifiedUser.otpBase32).toBe('');
        expect(modifiedUser.otpAuthUrl).toBe('');
        expect(result).toEqual({
          otpDisabled: true,
          user: {
            id: modifiedUser._id,
            firstName: modifiedUser.firstName,
            email: modifiedUser.email,
            otpEnabled: modifiedUser.otpEnabled,
          },
        });
      });

      it('should throw an error if token validation returns null', async () => {
        const testUser = {
          ...sampleFullUser,
          verified: true,
          otpBase32: 'base32Secret',
          otpEnabled: true,
          otpVerified: true,
        };
        const generateTOTPSpy = jest.spyOn(AuthService.prototype, 'generateTOTP');
        const otpAuthTOTPSpy = jest.spyOn(OTPAuth.TOTP.prototype, 'validate').mockReturnValue(null);

        const getFullUserByIdSpy = jest
          .spyOn(UserService.prototype, 'getFullUserById')
          // @ts-ignore
          .mockResolvedValue(testUser);
        const token = '123456';

        await expect(authService.disableOTP(testUser._id, token)).rejects.toThrow(
          new HttpException(HttpStatus.UNAUTHORIZED, 'token is invalid'),
        );
        expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
        expect(generateTOTPSpy).toHaveBeenCalledWith(testUser.otpBase32, testUser.email);
        expect(otpAuthTOTPSpy).toHaveBeenCalledWith({ token, window: 1 });
      });
    });

    describe('otpData', () => {
      it('should return otpAuthUrl and otpBase32 string of a user', async () => {
        const testUser = {
          ...sampleFullUser,
          verified: true,
          otpBase32: 'base32Secret',
          otpAuthUrl: 'authUrl',
        };
        const getFullUserByIdSpy = jest
          .spyOn(UserService.prototype, 'getFullUserById')
          // @ts-ignore
          .mockResolvedValue(testUser);
        const result = await authService.otpData(testUser._id);

        expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
        expect(result).toEqual({
          otpAuthUrl: testUser.otpAuthUrl,
          otpBase32: testUser.otpBase32,
        });
      });

      it('should throw an error if a user has no otpAuthUrl', async () => {
        const testUser = {
          ...sampleFullUser,
          verified: true,
        };
        const getFullUserByIdSpy = jest
          .spyOn(UserService.prototype, 'getFullUserById')
          // @ts-ignore
          .mockResolvedValue(testUser);
        await expect(authService.otpData(testUser._id)).rejects.toThrow(
          new HttpException(HttpStatus.UNAUTHORIZED, 'user otp not enabled'),
        );
        expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
      });
    });
  });

  describe('hashRecoveryCodes', () => {
    it('should hash each strings in an array and return an object with the "hash" and a "used" flag', async () => {
      const randStrings = ['foo', 'bar', 'baz'];
      const bcryptHashSpy = jest.spyOn(bcrypt, 'hash').mockImplementation((code, salt) => {
        return Promise.resolve(`hashed_${code}`);
      });

      const result = await authService.hashRecoveryCodes(randStrings);
      expect(bcryptHashSpy).toHaveBeenCalledTimes(randStrings.length);
      expect(result).toHaveLength(randStrings.length);
      expect(result).toEqual(
        expect.arrayContaining([
          { hash: 'hashed_foo', used: false },
          { hash: 'hashed_bar', used: false },
          { hash: 'hashed_baz', used: false },
        ]),
      );
    });
  });

  describe('validateRecoveryCode', () => {
    const plainCodes = ['foo', 'bar', 'baz'];
    const hashedCodes = [
      { hash: 'hashed_foo', used: true },
      { hash: 'hashed_bar', used: false },
      { hash: 'hashed_baz', used: false },
    ];

    it("should return a valid recovery code and update the used field of the matching code in user's record", async () => {
      const bcryptCompareSpy = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation((plainCode, hash) => {
          if (hash.includes(plainCode as string)) return Promise.resolve(true);
          else return Promise.resolve(false);
        });
      const testUser = {
        ...sampleFullUser,
        verified: true,
        recoveryCodes: [...hashedCodes],
      };
      const getFullUserByIdSpy = jest
        .spyOn(UserService.prototype, 'getFullUserById')
        // @ts-ignore
        .mockResolvedValue(testUser);
      const result = await authService.validateRecoveryCode(testUser._id, plainCodes[1]);

      expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
      expect(bcryptCompareSpy).toHaveBeenCalledTimes(2);
      expect(testUser.recoveryCodes[1].used).toBe(true);
      expect(testUser.save).toHaveBeenCalled();
      expect(result).toEqual({ validCode: true, recoveryCode: plainCodes[1] });
    });

    it('should throw an error if a code has been used', async () => {
      const bcryptCompareSpy = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation((plainCode, hash) => {
          if (hash.includes(plainCode as string)) return Promise.resolve(true);
          else return Promise.resolve(false);
        });
      const testUser = {
        ...sampleFullUser,
        verified: true,
        recoveryCodes: [...hashedCodes],
      };
      const getFullUserByIdSpy = jest
        .spyOn(UserService.prototype, 'getFullUserById')
        // @ts-ignore
        .mockResolvedValue(testUser);
      const recoveryCode = plainCodes[0];

      await expect(authService.validateRecoveryCode(testUser._id, recoveryCode)).rejects.toThrow(
        new HttpException(HttpStatus.NOT_FOUND, `code has been used: ${recoveryCode}`),
      );
      expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
      expect(bcryptCompareSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if a user has no recovery code', async () => {
      const bcryptCompareSpy = jest.spyOn(bcrypt, 'compare');
      const testUser = {
        ...sampleFullUser,
        verified: true,
      };
      const getFullUserByIdSpy = jest
        .spyOn(UserService.prototype, 'getFullUserById')
        // @ts-ignore
        .mockResolvedValue(testUser);
      await expect(authService.validateRecoveryCode(testUser._id, 'fakeCode')).rejects.toThrow(
        new HttpException(HttpStatus.NOT_FOUND, 'user has no recover code'),
      );
      expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
      expect(bcryptCompareSpy).not.toHaveBeenCalled();
    });

    it('should return undefined if a given recovery code does not have a valid hash', async () => {
      const bcryptCompareSpy = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation((plainCode, hash) => {
          if (hash.includes(plainCode as string)) return Promise.resolve(true);
          else return Promise.resolve(false);
        });
      const testUser = {
        ...sampleFullUser,
        verified: true,
        recoveryCodes: [...hashedCodes],
      };
      const getFullUserByIdSpy = jest
        .spyOn(UserService.prototype, 'getFullUserById')
        // @ts-ignore
        .mockResolvedValue(testUser);

      const result = await authService.validateRecoveryCode(testUser._id, 'fakeCode');

      expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
      expect(bcryptCompareSpy).toHaveBeenCalledTimes(hashedCodes.length);
      expect(result).toBe(undefined);
    });
  });

  describe('validCode', () => {
    it('should throw an error if validateRecoveryCode returns undefined', async () => {
      const validateCodeSpy = jest
        .spyOn(AuthService.prototype, 'validateRecoveryCode')
        .mockResolvedValue(undefined);
      await expect(authService.validCode(sampleFullUser._id, 'code')).rejects.toThrow(
        new HttpException(HttpStatus.NOT_FOUND, 'invalid recovery code'),
      );
      expect(validateCodeSpy).toHaveBeenCalledWith(sampleFullUser._id, 'code');
    });
  });

  describe('updateEmail', () => {
    it("should update an unverified user's email", async () => {
      const testUser = {
        ...sampleUser,
      };
      const newEmail = 'newTest@email.com';
      const updateUserSpy = jest
        .spyOn(UserService.prototype, 'updateUser')
        // @ts-ignore
        .mockResolvedValue({
          ...testUser,
          email: newEmail,
        });
      const verifyEmailSpy = jest.spyOn(AuthService.prototype, 'verifyEmail');

      const result = await authService.updateEmail(testUser._id, testUser.email, newEmail, fullUrl);

      const updatedUser = await updateUserSpy.mock.results[0].value;
      expect(updateUserSpy).toHaveBeenCalledWith(testUser._id, { email: newEmail });
      expect(verifyEmailSpy).not.toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          message: 'your email has been updated',
          data: {
            emailUpdated: true,
            newEmail: updatedUser.email,
            verifiedEmail: updatedUser.verified,
          },
        }),
      );
    });

    it("should update an verified user's email and send verification email", async () => {
      const testUser = {
        ...sampleUser,
        verified: true,
      };
      const newEmail = 'verifiedTest@email.com';
      const updateUserSpy = jest
        .spyOn(UserService.prototype, 'updateUser')
        // @ts-ignore
        .mockResolvedValue({
          ...testUser,
          email: newEmail,
          save: jest.fn().mockResolvedValue({
            ...testUser,
            verified: false,
          }),
        });

      const verifyEmailSpy = jest.spyOn(AuthService.prototype, 'verifyEmail').mockResolvedValue({
        message: `a verification link has been sent to ${newEmail}`,
        data: {
          sendVerifyEmail: true,
        },
      });

      const result = await authService.updateEmail(testUser._id, testUser.email, newEmail, fullUrl);

      const updatedUser = await updateUserSpy.mock.results[0].value;

      expect(updateUserSpy).toHaveBeenCalledWith(testUser._id, { email: newEmail });
      expect(verifyEmailSpy).toHaveBeenCalledWith(updatedUser._id, fullUrl);
      expect(result).toEqual(
        expect.objectContaining({
          message: `a verification link has been sent to ${updatedUser.email}`,
          data: {
            sendVerifyEmail: true,
          },
        }),
      );
    });

    it('should throw an error if new email is same as old email', async () => {
      const testUser = {
        ...sampleUser,
        verified: true,
      };
      const updateUserSpy = jest.spyOn(UserService.prototype, 'updateUser');
      const verifyEmailSpy = jest.spyOn(AuthService.prototype, 'verifyEmail');

      await expect(
        authService.updateEmail(testUser._id, testUser.email, testUser.email, fullUrl),
      ).rejects.toThrow(
        new HttpException(HttpStatus.BAD_REQUEST, 'new email should not be the same as old email'),
      );
      expect(updateUserSpy).not.toHaveBeenCalled();
      expect(verifyEmailSpy).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('should send a verification email to an unverified user', async () => {
      const lengthOfSecret = Number(process.env.USER_SECRET_TOKEN_LENGTH);
      const newSecretToken = 'lahydbcwhdvvodbjaysne';

      const testUser = {
        ...sampleFullUser,
      };
      const getFullUserByIdSpy = jest
        .spyOn(UserService.prototype, 'getFullUserById')
        // @ts-ignore
        .mockResolvedValue({
          ...testUser,
          save: jest.fn().mockResolvedValue({
            ...testUser,
            secretToken: newSecretToken,
          }),
        });
      const randStringSpy = jest
        .spyOn(cryptoHelpers, 'generateRandomString')
        .mockReturnValue(newSecretToken);

      const mEmailToken = { expiresIn: 123, token: 'newEmailToken' };
      const createTokenSpy = jest.spyOn(token, 'createToken').mockReturnValue(mEmailToken);

      const encryptDataSpy = jest
        .spyOn(cryptoHelpers, 'encryptData')
        .mockImplementation((data, inputType, outputType) => `${data}-${inputType}-${outputType}`);
      const sendVerifyMailSpy = jest.spyOn(EmailService.prototype, 'sendVerifyMail');

      const result = await authService.verifyEmail(testUser._id, fullUrl);

      const updatedUser = await getFullUserByIdSpy.mock.results[0].value;

      const encryptEmailTokenResult = encryptDataSpy.mock.results[0].value;
      const encryptEmailResult = encryptDataSpy.mock.results[1].value;
      const mockVerificationUrl = `${fullUrl}/${encryptEmailResult}/${encryptEmailTokenResult}`;

      expect(randStringSpy).toHaveBeenCalledWith(lengthOfSecret);
      expect(updatedUser.save).toHaveBeenCalled();
      expect(createTokenSpy).toHaveBeenCalledWith({ secret: newSecretToken }, 60 * 60);
      expect(encryptDataSpy).toHaveBeenCalledTimes(2);
      expect(encryptDataSpy.mock.calls[0]).toEqual(
        expect.arrayContaining([mEmailToken.token, 'utf-8', 'hex']),
      );
      expect(encryptDataSpy.mock.calls[1]).toEqual(
        expect.arrayContaining([updatedUser.email, 'utf-8', 'hex']),
      );
      expect(sendVerifyMailSpy).toHaveBeenCalledWith(
        updatedUser.email,
        updatedUser.firstName,
        mockVerificationUrl,
      );
      expect(result).toEqual(
        expect.objectContaining({
          message: `a verification link has been sent to ${updatedUser.email}`,
          data: {
            sendVerifyEmail: true,
          },
        }),
      );
    });

    it('should throw an error if a user is verified', async () => {
      const testUser = {
        ...sampleUser,
        verified: true,
      };
      const getFullUserByIdSpy = jest
        .spyOn(UserService.prototype, 'getFullUserById')
        // @ts-ignore
        .mockResolvedValue(testUser);
      const randStringSpy = jest.spyOn(cryptoHelpers, 'generateRandomString');
      const createTokenSpy = jest.spyOn(token, 'createToken');
      const encryptDataSpy = jest.spyOn(cryptoHelpers, 'encryptData');
      const sendVerifyMailSpy = jest.spyOn(EmailService.prototype, 'sendVerifyMail');

      await expect(authService.verifyEmail(testUser._id, fullUrl)).rejects.toThrow(
        new HttpException(HttpStatus.BAD_REQUEST, 'user is already verified'),
      );
      expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
      expect(randStringSpy).not.toHaveBeenCalled();
      expect(createTokenSpy).not.toHaveBeenCalled();
      expect(encryptDataSpy).not.toHaveBeenCalled();
      expect(sendVerifyMailSpy).not.toHaveBeenCalled();
    });
  });

  describe('validateEmail', () => {
    const encryptedEmail = 'user@test.com-utf-8-hex';
    const emailToken = 'newEmailToken-utf-8-hex';

    it('should successfully verify the payload secret and a user secret then update the verified status of the user', async () => {
      const newSecretToken = 'ibSWDOVuhpiiadiasdboi';
      const testUser = {
        ...sampleFullUser,
        secretToken: newSecretToken,
      };

      const verifyTokenSpy = jest.spyOn(token, 'verifyToken').mockResolvedValue({
        secret: newSecretToken,
        expiresIn: 1000,
      });

      const decryptDataSpy = jest
        .spyOn(cryptoHelpers, 'decryptData')
        .mockImplementation((data, inputType, outputType) => data.split(`-${inputType}`)[0]);

      const getFullUserByEmailSpy = jest
        .spyOn(UserService.prototype, 'getFullUserByEmail')
        // @ts-ignore
        .mockResolvedValue({
          ...testUser,
          save: jest.fn().mockResolvedValue({
            ...testUser,
            verified: true,
            secretToken: '',
          }),
        });
      const result = await authService.validateEmail(encryptedEmail, emailToken);

      const updatedUser = await getFullUserByEmailSpy.mock.results[0].value;

      const decryptTokenResult = decryptDataSpy.mock.results[0].value;
      const decryptEmailResult = decryptDataSpy.mock.results[1].value;

      expect(decryptDataSpy).toHaveBeenCalledTimes(2);
      expect(decryptDataSpy.mock.calls[0]).toEqual(
        expect.arrayContaining([emailToken, 'hex', 'utf-8']),
      );
      expect(verifyTokenSpy).toHaveBeenCalledWith(decryptTokenResult);
      expect(decryptDataSpy.mock.calls[1]).toEqual(
        expect.arrayContaining([encryptedEmail, 'hex', 'utf-8']),
      );
      expect(getFullUserByEmailSpy).toHaveBeenCalledWith(decryptEmailResult);
      expect(updatedUser.save).toHaveBeenCalled();
      expect(result).toEqual({
        email: updatedUser.email,
        emailVerified: updatedUser.verified,
      });
    });

    const errorMessage = 'verification failed, possibly link is invalid or expired';

    it('should throw an error if payload is an instance of JsonWebError', async () => {
      const verifyTokenSpy = jest
        .spyOn(token, 'verifyToken')
        .mockResolvedValue(new JsonWebTokenError('Invalid Secret Token'));

      const decryptDataSpy = jest
        .spyOn(cryptoHelpers, 'decryptData')
        .mockImplementation((data, inputType, outputType) => data.split(`-${inputType}`)[0]);

      const getFullUserByEmailSpy = jest.spyOn(UserService.prototype, 'getFullUserByEmail');

      await expect(authService.validateEmail(encryptedEmail, emailToken)).rejects.toThrow(
        new HttpException(HttpStatus.BAD_REQUEST, errorMessage),
      );

      const decryptTokenResult = decryptDataSpy.mock.results[0].value;
      expect(verifyTokenSpy).toHaveBeenCalledWith(decryptTokenResult);
      expect(decryptDataSpy).toHaveBeenCalledTimes(1);
      expect(decryptDataSpy.mock.calls[0]).toEqual(
        expect.arrayContaining([emailToken, 'hex', 'utf-8']),
      );
      expect(getFullUserByEmailSpy).not.toHaveBeenCalled();
    });

    it('should throw an error if payload secret and user secret does not match', async () => {
      const newSecretToken = 'ibSWDOVuhpiiadiasdboi';
      const testUser = {
        ...sampleFullUser,
        secretToken: newSecretToken,
      };

      const verifyTokenSpy = jest.spyOn(token, 'verifyToken').mockResolvedValue({
        secret: 'mustbeveryFAKE',
        expiresIn: 1000,
      });

      const decryptDataSpy = jest
        .spyOn(cryptoHelpers, 'decryptData')
        .mockImplementation((data, inputType, outputType) => data.split(`-${inputType}`)[0]);

      const getFullUserByEmailSpy = jest
        .spyOn(UserService.prototype, 'getFullUserByEmail')
        // @ts-ignore
        .mockResolvedValue({
          ...testUser,
          save: jest.fn().mockResolvedValue({
            ...testUser,
            verified: true,
            secretToken: '',
          }),
        });
      await expect(authService.validateEmail(encryptedEmail, emailToken)).rejects.toThrow(
        new HttpException(HttpStatus.BAD_REQUEST, errorMessage),
      );
      const decryptTokenResult = decryptDataSpy.mock.results[0].value;
      const decryptEmailResult = decryptDataSpy.mock.results[1].value;

      expect(decryptDataSpy).toHaveBeenCalledTimes(2);
      expect(decryptDataSpy.mock.calls[0]).toEqual(
        expect.arrayContaining([emailToken, 'hex', 'utf-8']),
      );
      expect(verifyTokenSpy).toHaveBeenCalledWith(decryptTokenResult);
      expect(decryptDataSpy.mock.calls[1]).toEqual(
        expect.arrayContaining([encryptedEmail, 'hex', 'utf-8']),
      );
      expect(getFullUserByEmailSpy).toHaveBeenCalledWith(decryptEmailResult);
      expect(testUser.save).not.toHaveBeenCalled();
    });
  });

  describe('passwordResetRequest', () => {
    it('should set secretToken and passwordResetRequest field of a user and send password reset email', async () => {
      const lengthOfSecret = Number(process.env.USER_SECRET_TOKEN_LENGTH);
      const newSecretToken = 'aicycgweiuvbsdivn';

      const testUser = {
        ...sampleFullUser,
        verified: true,
      };
      const getFullUserByIdSpy = jest
        .spyOn(UserService.prototype, 'getFullUserById')
        // @ts-ignore
        .mockResolvedValue({
          ...testUser,
          save: jest.fn().mockResolvedValue({
            ...testUser,
            secretToken: newSecretToken,
            passwordResetRequest: true,
          }),
        });
      const randStringSpy = jest
        .spyOn(cryptoHelpers, 'generateRandomString')
        .mockReturnValue(newSecretToken);

      const mPasswordToken = { expiresIn: 123, token: 'newEmailToken' };
      const createTokenSpy = jest.spyOn(token, 'createToken').mockReturnValue(mPasswordToken);

      const encryptDataSpy = jest
        .spyOn(cryptoHelpers, 'encryptData')
        .mockImplementation((data, inputType, outputType) => `${data}-${inputType}-${outputType}`);
      const sendPasswordResetMailSpy = jest.spyOn(EmailService.prototype, 'sendPasswordResetMail');

      const result = await authService.passwordResetRequest(testUser._id, fullUrl);

      const updatedUser = await getFullUserByIdSpy.mock.results[0].value;

      const encryptEmailResult = encryptDataSpy.mock.results[0].value;
      const encryptPasswordTokenResult = encryptDataSpy.mock.results[1].value;
      const mockVerificationUrl = `${fullUrl}/${encryptEmailResult}/${encryptPasswordTokenResult}`;

      expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
      expect(randStringSpy).toHaveBeenCalledWith(lengthOfSecret);
      expect(updatedUser.save).toHaveBeenCalled();
      expect(updatedUser.secretToken).toBe(newSecretToken);
      expect(updatedUser.passwordResetRequest).toBe(true);
      expect(encryptDataSpy).toHaveBeenCalledTimes(2);
      expect(encryptDataSpy.mock.calls[0]).toEqual(
        expect.arrayContaining([updatedUser.email, 'utf-8', 'hex']),
      );
      expect(createTokenSpy).toHaveBeenCalledWith({ secret: newSecretToken }, 60 * 60);
      expect(encryptDataSpy.mock.calls[1]).toEqual(
        expect.arrayContaining([mPasswordToken.token, 'utf-8', 'hex']),
      );
      expect(sendPasswordResetMailSpy).toHaveBeenCalledWith(
        updatedUser.email,
        updatedUser.firstName,
        mockVerificationUrl,
      );
      expect(result).toEqual({
        sendPasswordResetEmail: updatedUser.passwordResetRequest,
      });
    });

    it('should throw an error if a user is not verified', async () => {
      const testUser = {
        ...sampleFullUser,
      };
      const getFullUserByIdSpy = jest
        .spyOn(UserService.prototype, 'getFullUserById')
        // @ts-ignore
        .mockResolvedValue(testUser);
      const randStringSpy = jest.spyOn(cryptoHelpers, 'generateRandomString');
      const createTokenSpy = jest.spyOn(token, 'createToken');
      const encryptDataSpy = jest.spyOn(cryptoHelpers, 'encryptData');
      const sendPasswordResetMailSpy = jest.spyOn(EmailService.prototype, 'sendPasswordResetMail');

      await expect(authService.passwordResetRequest(testUser._id, fullUrl)).rejects.toThrow(
        new HttpException(HttpStatus.UNAUTHORIZED, 'only verified users can reset their password'),
      );
      expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
      expect(randStringSpy).not.toHaveBeenCalled();
      expect(createTokenSpy).not.toHaveBeenCalled();
      expect(encryptDataSpy).not.toHaveBeenCalled();
      expect(sendPasswordResetMailSpy).not.toHaveBeenCalled();
    });
  });

  describe('validatePasswordReset', () => {
    const encryptedEmail = 'user@test.com-utf-8-hex';
    const passwordToken = 'newPasswordToken-utf-8-hex';

    it('should grant password reset permission to a user with passwordResetRequest', async () => {
      const newSecretToken = 'pqewmrvdjtnlaioaedh';

      const testUser = {
        ...sampleFullUser,
        verified: true,
        secretToken: newSecretToken,
        passwordResetRequest: true,
      };
      const getFullUserByEmailSpy = jest
        .spyOn(UserService.prototype, 'getFullUserByEmail')
        // @ts-ignore
        .mockResolvedValue({
          ...testUser,
          save: jest.fn().mockResolvedValue({
            ...testUser,
            secretToken: newSecretToken,
            passwordResetRequest: true,
            grantPasswordReset: true,
          }),
        });
      const verifyTokenSpy = jest.spyOn(token, 'verifyToken').mockResolvedValue({
        secret: newSecretToken,
        expiresIn: 1200,
      });

      const decryptDataSpy = jest
        .spyOn(cryptoHelpers, 'decryptData')
        .mockImplementation((data, inputType, outputType) => data.split(`-${inputType}`)[0]);
      const encryptDataSpy = jest
        .spyOn(cryptoHelpers, 'encryptData')
        .mockImplementation((data, inputType, outputType) => `${data}-${inputType}-${outputType}`);

      const result = await authService.validatePasswordReset(encryptedEmail, passwordToken);
      const updatedUser = await getFullUserByEmailSpy.mock.results[0].value;

      const decryptTokenResult = decryptDataSpy.mock.results[0].value;
      const decryptEmailResult = decryptDataSpy.mock.results[1].value;

      const base64SecretToken = encryptDataSpy.mock.results[0].value;

      expect(decryptDataSpy).toHaveBeenCalledTimes(2);
      expect(decryptDataSpy.mock.calls[0]).toEqual(
        expect.arrayContaining([passwordToken, 'hex', 'utf-8']),
      );
      expect(verifyTokenSpy).toHaveBeenCalledWith(decryptTokenResult);
      expect(decryptDataSpy.mock.calls[1]).toEqual(
        expect.arrayContaining([encryptedEmail, 'hex', 'utf-8']),
      );
      expect(getFullUserByEmailSpy).toHaveBeenCalledWith(decryptEmailResult);
      expect(updatedUser.grantPasswordReset).toBe(true);
      expect(updatedUser.save).toHaveBeenCalled();
      expect(encryptDataSpy.mock.calls[0]).toEqual(
        expect.arrayContaining([newSecretToken, 'utf-8', 'base64']),
      );
      expect(result).toEqual({
        grantPasswordReset: updatedUser.grantPasswordReset,
        passwordToken: base64SecretToken,
      });
    });

    const errorMessage =
      'failed to grant password reset permissions, possibly link is invalid, expired or wrong credentials';

    it('should throw an error if payload is an instance of JsonWebTokenError', async () => {
      const verifyTokenSpy = jest
        .spyOn(token, 'verifyToken')
        .mockResolvedValue(new JsonWebTokenError('Invalid Secret Token'));
      const decryptDataSpy = jest
        .spyOn(cryptoHelpers, 'decryptData')
        .mockImplementation((data, inputType, outputType) => data.split(`-${inputType}`)[0]);

      const encryptDataSpy = jest.spyOn(cryptoHelpers, 'encryptData');
      const getFullUserByEmailSpy = jest.spyOn(UserService.prototype, 'getFullUserByEmail');
      await expect(
        authService.validatePasswordReset(encryptedEmail, passwordToken),
      ).rejects.toThrow(new HttpException(HttpStatus.BAD_REQUEST, errorMessage));

      const decryptTokenResult = decryptDataSpy.mock.results[0].value;
      expect(decryptDataSpy).toHaveBeenCalledTimes(1);
      expect(verifyTokenSpy).toHaveBeenCalledWith(decryptTokenResult);
      expect(getFullUserByEmailSpy).not.toHaveBeenCalled();
      expect(encryptDataSpy).not.toHaveBeenCalled();
    });

    it('should throw an error if user.passwordResetRequest is false', async () => {
      const newSecretToken = 'pqewmrvdjtnlaioaedh';

      const testUser = {
        ...sampleFullUser,
        verified: true,
      };
      const getFullUserByEmailSpy = jest
        .spyOn(UserService.prototype, 'getFullUserByEmail')
        // @ts-ignore
        .mockResolvedValue(testUser);
      const verifyTokenSpy = jest.spyOn(token, 'verifyToken').mockResolvedValue({
        secret: newSecretToken,
        expiresIn: 1200,
      });

      const decryptDataSpy = jest
        .spyOn(cryptoHelpers, 'decryptData')
        .mockImplementation((data, inputType, outputType) => data.split(`-${inputType}`)[0]);
      const encryptDataSpy = jest.spyOn(cryptoHelpers, 'encryptData');

      await expect(
        authService.validatePasswordReset(encryptedEmail, passwordToken),
      ).rejects.toThrow(
        new HttpException(HttpStatus.BAD_REQUEST, 'user made no request to reset password'),
      );

      const decryptTokenResult = decryptDataSpy.mock.results[0].value;
      const decryptEmailResult = decryptDataSpy.mock.results[1].value;
      expect(decryptDataSpy).toHaveBeenCalledTimes(2);
      expect(verifyTokenSpy).toHaveBeenCalledWith(decryptTokenResult);
      expect(getFullUserByEmailSpy).toHaveBeenCalledWith(decryptEmailResult);
      expect(encryptDataSpy).not.toHaveBeenCalled();
    });

    it('should throw an error if payload secret and user secretToken token does not match', async () => {
      const newSecretToken = 'pqewmrvdjtnlaioaedh';

      const testUser = {
        ...sampleFullUser,
        verified: true,
        secretToken: newSecretToken,
        passwordResetRequest: true,
      };
      const getFullUserByEmailSpy = jest
        .spyOn(UserService.prototype, 'getFullUserByEmail')
        // @ts-ignore
        .mockResolvedValue({
          ...testUser,
          save: jest.fn().mockResolvedValue({
            ...testUser,
            secretToken: newSecretToken,
            passwordResetRequest: true,
            grantPasswordReset: true,
          }),
        });
      const verifyTokenSpy = jest.spyOn(token, 'verifyToken').mockResolvedValue({
        secret: 'InvalidSecretToken',
        expiresIn: 1200,
      });

      const decryptDataSpy = jest
        .spyOn(cryptoHelpers, 'decryptData')
        .mockImplementation((data, inputType, outputType) => data.split(`-${inputType}`)[0]);
      const encryptDataSpy = jest.spyOn(cryptoHelpers, 'encryptData');

      await expect(
        authService.validatePasswordReset(encryptedEmail, passwordToken),
      ).rejects.toThrow(new HttpException(HttpStatus.BAD_REQUEST, errorMessage));

      const updatedUser = await getFullUserByEmailSpy.mock.results[0].value;
      const decryptTokenResult = decryptDataSpy.mock.results[0].value;
      const decryptEmailResult = decryptDataSpy.mock.results[1].value;

      expect(decryptDataSpy).toHaveBeenCalledTimes(2);
      expect(verifyTokenSpy).toHaveBeenCalledWith(decryptTokenResult);
      expect(getFullUserByEmailSpy).toHaveBeenCalledWith(decryptEmailResult);
      expect(encryptDataSpy).not.toHaveBeenCalled();
      expect(updatedUser.save).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const newPassword = 'freshAndStrong88£';
    const newSecretToken = 'uqteygfuoihqcjadmp';

    it('should update a user`s password and the save updated user record', async () => {
      const testUser = {
        ...sampleFullUser,
        verified: true,
        secretToken: newSecretToken,
        passwordResetRequest: true,
        grantPasswordReset: true,
      };
      const getFullUserByIdSpy = jest
        .spyOn(UserService.prototype, 'getFullUserById')
        // @ts-ignore
        .mockResolvedValue({
          ...testUser,
          isValidPassword: jest.fn().mockResolvedValue(false),
        });
      const result = await authService.resetPassword(testUser._id, newSecretToken, newPassword);

      const updatedUser = await getFullUserByIdSpy.mock.results[0].value;

      expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
      expect(updatedUser.isValidPassword).toHaveBeenCalledWith(newPassword);
      expect(updatedUser.password).toBe(newPassword);
      expect(updatedUser.passwordResetRequest).toBe(false);
      expect(updatedUser.grantPasswordReset).toBe(false);
      expect(updatedUser.secretToken).toBe('');
      expect(updatedUser.save).toHaveBeenCalled();
      expect(result).toEqual({
        successfulPasswordReset: true,
      });
    });

    it('should throw an error if a user`s verified, grantPasswordReset or passwordResetRequest field is false', async () => {
      const testUser = {
        ...sampleFullUser,
        verified: true,
        secretToken: newSecretToken,
        passwordResetRequest: true,
        grantPasswordReset: false,
      };
      const getFullUserByIdSpy = jest
        .spyOn(UserService.prototype, 'getFullUserById')
        // @ts-ignore
        .mockResolvedValue(testUser);

      await expect(
        authService.resetPassword(testUser._id, newSecretToken, newPassword),
      ).rejects.toThrow(
        new HttpException(
          HttpStatus.BAD_REQUEST,
          'password reset failed, user not verified or has no permission to reset password',
        ),
      );

      const updatedUser = await getFullUserByIdSpy.mock.results[0].value;
      expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
      expect(updatedUser.isValidPassword).not.toHaveBeenCalled();
      expect(updatedUser.save).not.toHaveBeenCalled();
    });

    it('should throw an error if passwordToken and user.secretToken does not match', async () => {
      const testUser = {
        ...sampleFullUser,
        verified: true,
        secretToken: newSecretToken,
        passwordResetRequest: true,
        grantPasswordReset: true,
      };
      const getFullUserByIdSpy = jest
        .spyOn(UserService.prototype, 'getFullUserById')
        // @ts-ignore
        .mockResolvedValue(testUser);
      await expect(
        authService.resetPassword(testUser._id, 'someInvalidToken', newPassword),
      ).rejects.toThrow(new HttpException(HttpStatus.BAD_REQUEST, 'invalid credentials'));

      const updatedUser = await getFullUserByIdSpy.mock.results[0].value;
      expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
      expect(updatedUser.isValidPassword).not.toHaveBeenCalled();
      expect(updatedUser.save).not.toHaveBeenCalled();
    });

    it('should throw an error if the old password is provided as the new password', async () => {
      const testUser = {
        ...sampleFullUser,
        verified: true,
        secretToken: newSecretToken,
        passwordResetRequest: true,
        grantPasswordReset: true,
      };
      const getFullUserByIdSpy = jest
        .spyOn(UserService.prototype, 'getFullUserById')
        // @ts-ignore
        .mockResolvedValue({
          ...testUser,
          isValidPassword: jest.fn().mockResolvedValue(true),
        });

      await expect(
        authService.resetPassword(testUser._id, newSecretToken, testUser.password),
      ).rejects.toThrow(new HttpException(HttpStatus.BAD_REQUEST, 'unacceptable credentials'));

      const updatedUser = await getFullUserByIdSpy.mock.results[0].value;
      expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
      expect(updatedUser.isValidPassword).toHaveBeenCalledWith(testUser.password);
      expect(updatedUser.save).not.toHaveBeenCalled();
    });
  });

  describe('cancelPasswordReset', () => {
    const newPasswordToken = 'uqteygfuoihqcjadmp';

    it('should cancel a user`s password reset request', async () => {
      const testUser = {
        ...sampleFullUser,
        verified: true,
        secretToken: newPasswordToken,
        passwordResetRequest: true,
        grantPasswordReset: true,
      };
      const getFullUserByIdSpy = jest
        .spyOn(UserService.prototype, 'getFullUserById')
        // @ts-ignore
        .mockResolvedValue(testUser);
      const result = await authService.cancelPasswordReset(testUser._id, newPasswordToken);

      const updatedUser = await getFullUserByIdSpy.mock.results[0].value;

      expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
      expect(updatedUser.passwordResetRequest).toBe(false);
      expect(updatedUser.grantPasswordReset).toBe(false);
      expect(updatedUser.secretToken).toBe('');
      expect(updatedUser.save).toHaveBeenCalled();
      expect(result).toEqual({
        passwordResetCanceled: true,
      });
    });

    it('should throw an error if a user`s passwordResetRequest or grantPasswordReset field is false', async () => {
      const testUser = {
        ...sampleFullUser,
        verified: true,
        secretToken: newPasswordToken,
        passwordResetRequest: true,
        grantPasswordReset: false,
      };
      const getFullUserByIdSpy = jest
        .spyOn(UserService.prototype, 'getFullUserById')
        // @ts-ignore
        .mockResolvedValue(testUser);

      await expect(authService.cancelPasswordReset(testUser._id, newPasswordToken)).rejects.toThrow(
        new HttpException(
          HttpStatus.BAD_REQUEST,
          'password reset request not received or permission not granted',
        ),
      );

      const updatedUser = await getFullUserByIdSpy.mock.results[0].value;
      expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
      expect(updatedUser.save).not.toHaveBeenCalled();
    });

    it('should throw an error if passwordToken and user.secretToken does not match', async () => {
      const testUser = {
        ...sampleFullUser,
        verified: true,
        secretToken: newPasswordToken,
        passwordResetRequest: true,
        grantPasswordReset: true,
      };
      const getFullUserByIdSpy = jest
        .spyOn(UserService.prototype, 'getFullUserById')
        // @ts-ignore
        .mockResolvedValue(testUser);

      await expect(authService.cancelPasswordReset(testUser._id, 'invalidToken')).rejects.toThrow(
        new HttpException(HttpStatus.BAD_REQUEST, 'invalid credentials'),
      );

      const updatedUser = await getFullUserByIdSpy.mock.results[0].value;
      expect(getFullUserByIdSpy).toHaveBeenCalledWith(testUser._id);
      expect(updatedUser.save).not.toHaveBeenCalled();
    });
  });
});
