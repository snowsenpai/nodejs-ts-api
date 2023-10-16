import { Response } from 'express';
import * as OTPAuth from 'otpauth';
import * as QRCOde from 'qrcode';
import { PassThrough } from 'stream';
import { hash, compare } from 'bcrypt';
import { JsonWebTokenError } from 'jsonwebtoken';
import UserService from '../user/user.service';
import EmailService from '../email/email.service';
import token from '@/utils/token.util';
import { Token } from '@/utils/interfaces/token.interface';
import { HttpException, HttpStatus } from '@/utils/exceptions/index';
import cryptoHelper from '@/utils/crypto-helpers.util';

class AuthService {
  private UserService = new UserService();
  private EmailService = new EmailService();

  /**
   * Attempt to login a user
   */
  public async login(email: string, password: string) {
    const user = await this.UserService.getFullUserByEmail(email);
    // TODO check user.resetPasswordRequest, if true, throw 401, dont give access token

    const validPassword = await user.isValidPassword(password);

    if (validPassword === false) {
      throw new HttpException(HttpStatus.UNAUTHORIZED, 'wrong credentials');
    }
    const accessToken = token.createToken({ id: user._id });

    return {
      accessToken,
      userOtpEnabled: user.otpEnabled,
    };
  }

  /**
   * generateTOTP
   */
  public generateTOTP(secret: string, label?: string) {
    const newTOTP = new OTPAuth.TOTP({
      issuer: process.env.APP_NAME,
      label: label || process.env.APP_NAME,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret,
    });
    return newTOTP;
  }

  /**
   * generateOTP
   */
  public async generateOTP(userId: string) {
    const user = await this.UserService.getFullUserById(userId);

    if (user.verified === false) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'only verified users can enable OTP');
    }

    const base32Secret = cryptoHelper.generateRandomBase32(24);

    const totp = this.generateTOTP(base32Secret, user.email);

    const otpUrl = totp.toString();

    user.otpAuthUrl = otpUrl;
    user.otpBase32 = base32Secret;
    await user.save();

    return { otpUrl, base32Secret };
  }

  /**
   * verifyOTP
   */
  public async verifyOTP(userId: string, token: string) {
    const user = await this.UserService.getFullUserById(userId);
    //TODO check user.otpBase32 if empty in a middleware fn, mount after authenticatedMW
    const secret = user.otpBase32;

    const totp = this.generateTOTP(secret, user.email);

    const delta = totp.validate({ token });

    if (delta === null) {
      throw new HttpException(HttpStatus.UNAUTHORIZED, 'token is invalid or user does not exist');
    }

    user.otpEnabled = true;
    user.otpVerified = true;

    const recoveryCodes = cryptoHelper.randomStringArray(8, 10);

    const hashedRecoveryCodes = await this.hashRecoveryCodes(recoveryCodes);

    user.recoveryCodes = hashedRecoveryCodes;

    const updatedUser = await user.save();

    return {
      otpVerified: updatedUser.otpVerified,
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        email: updatedUser.email,
        otpEnabled: updatedUser.otpEnabled,
      },
      recoveryCodes,
    };
  }

  /**
   * validate otp codes generated by user's authenticator app
   */
  public async validateOTP(userId: string, token: string) {
    const user = await this.UserService.getFullUserById(userId);
    //TODO check user.otpVerified status in a middleware fn, mount after authenticatedMW
    const secret = user.otpBase32;

    const totp = this.generateTOTP(secret, user.email);

    const delta = totp.validate({ token, window: 1 });

    if (delta === null) {
      throw new HttpException(HttpStatus.UNAUTHORIZED, 'token is invalid or user does not exist');
    }

    return { otpValid: true };
  }

  /**
   * disableOTP
   */
  public async disableOTP(userId: string, token: string) {
    const user = await this.UserService.getFullUserById(userId);
    //TODO check user.otpVerified status in a middleware fn, mount after authenticatedMW
    const secret = user.otpBase32;

    const totp = this.generateTOTP(secret, user.email);

    const delta = totp.validate({ token, window: 1 });

    // TODO review error messages
    if (delta === null) {
      throw new HttpException(HttpStatus.UNAUTHORIZED, 'token is invalid or user does not exist');
    }

    user.otpEnabled = false;
    user.otpVerified = false;
    user.otpBase32 = '';
    user.otpAuthUrl = '';

    const updatedUser = await user.save();

    return {
      otpDisabled: true,
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        email: updatedUser.email,
        otpEnabled: updatedUser.otpEnabled,
      },
    };
  }

  /**
   * otpData
   * get user's otp data if enabled
   */
  public async otpData(userId: string) {
    const user = await this.UserService.getFullUserById(userId);

    const enabled = user.otpAuthUrl;
    if (!enabled) throw new HttpException(HttpStatus.UNAUTHORIZED, 'user otp not enabled');

    return {
      otpAuthUrl: user.otpAuthUrl,
      otpBase32: user.otpBase32,
    };
  }

  /**
   * send data as qrcode
   * a qrcode fileStream is created and piped to the response stream
   * e.g for a PaymentService
   */
  public async responseWithQRCode(data: string, res: Response) {
    const qrStream = new PassThrough();
    await QRCOde.toFileStream(qrStream, data, {
      width: 200,
    });

    qrStream.pipe(res);
  }

  /**
   * hashStrings
   * hash an array of random strings as recovery codes of user
   */
  public async hashRecoveryCodes(recoveryCodes: string[]) {
    const hashedCodes = await Promise.all(
      recoveryCodes.map(async (code) => {
        const hasedCode = await hash(code, 7);
        return {
          hash: hasedCode,
          used: false,
        };
      }),
    );
    return hashedCodes;
  }

  /**
   * validateRecoveryCode
   * if no match is found will return `undefined`
   */
  public async validateRecoveryCode(userId: string, recoveryCode: string) {
    const user = await this.UserService.getFullUserById(userId);
    if (!user.recoveryCodes.length) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'user has no recover code');
    }
    const recoveryCodes = user.recoveryCodes;

    //! use array method on user.recoveryCodes, no need for a for-loop
    for (const code of recoveryCodes) {
      const isMatch = await compare(recoveryCode, code.hash);

      if (isMatch) {
        if (code.used) {
          //! wrong status code
          throw new HttpException(HttpStatus.NOT_FOUND, `code has been used: ${recoveryCode}`);
        } else {
          code.used = true;
          await user.save();

          return { validCode: true, recoveryCode };
        }
      }
    }
    //TODO throw error here, no need for validCode method
  }

  /**
   * validCode
   * handle `undefined` case from `validateRecoveryCode` method
   */
  public async validCode(userId: string, recoveryCode: string) {
    const result = await this.validateRecoveryCode(userId, recoveryCode);
    if (!result) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'invalid recovery code');
    }
    return result;
  }

  /**
   * updateEmail
   */
  public async updateEmail(userId: string, oldEmail: string, newEmail: string, fullUrl: string) {
    if (newEmail === oldEmail) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'new email should not be the same as old email',
      );
    }

    const updatedUser = await this.UserService.updateUser(userId, { email: newEmail });

    // TODO review conditionals, no need for deep equality checks for booleans, use the boolean value or NOT operator !
    if (updatedUser.verified === true) {
      updatedUser.verified = false;
      const oldVerifiedUser = await updatedUser.save();

      return await this.verifyEmail(oldVerifiedUser._id, fullUrl);
    }

    return {
      message: 'your email has been updated',
      data: {
        emailUpdated: true,
        newEmail: updatedUser.email,
        verifiedEmail: updatedUser.verified,
      },
    };
  }

  /**
   * verifyEmail
   */
  public async verifyEmail(userId: string, fullURL: string) {
    const user = await this.UserService.getFullUserById(userId);

    if (user.verified) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'user is already verified');
    }

    const lengthOfSecretToken = Number(process.env.USER_SECRET_TOKEN_LENGTH);
    const secretToken = cryptoHelper.generateRandomString(lengthOfSecretToken);

    user.secretToken = secretToken;
    const updatedUser = await user.save();

    const tokenExpiry = 60 * 60; // an hour
    const emailJWT = token.createToken({ secret: secretToken }, tokenExpiry).token;
    // when validating, encrypted data should be decrypted
    const emailToken = cryptoHelper.encryptData(emailJWT, 'utf-8', 'hex');

    const encryptedUserEmail = cryptoHelper.encryptData(updatedUser.email, 'utf-8', 'hex');

    //! dynamically send frontend url with concatenated data rather than backend url
    const verificationURL = `${fullURL}/${encryptedUserEmail}/${emailToken}`;

    await this.EmailService.sendVerifyMail(
      updatedUser.email,
      updatedUser.firstName,
      verificationURL,
    );

    return {
      message: `a verification link has been sent to ${updatedUser.email}`,
      data: {
        sendVerifyEmail: true,
      },
    };
  }

  /**
   * validateEmail
   * @param encryptedEmail encrypted `hex` string
   * @param emailToken jwt `Token`
   */
  public async validateEmail(encryptedEmail: string, emailToken: string) {
    const emailJWT = cryptoHelper.decryptData(emailToken, 'hex', 'utf-8');
    const payload: Token | JsonWebTokenError = await token.verifyToken(emailJWT);

    const errorMesage = 'verification failed, possibly link is invalid or expired';

    if (payload instanceof JsonWebTokenError) {
      throw new HttpException(HttpStatus.BAD_REQUEST, errorMesage);
    }

    // TODO prevent access for verified users, find user first before verifing jwt
    const unverifiedUserEmail = cryptoHelper.decryptData(encryptedEmail, 'hex', 'utf-8');

    const existingUser = await this.UserService.getFullUserByEmail(unverifiedUserEmail);

    if (payload.secret !== existingUser.secretToken) {
      throw new HttpException(HttpStatus.BAD_REQUEST, errorMesage);
    }

    existingUser.verified = true;
    existingUser.secretToken = '';

    const verifiedUser = await existingUser.save();

    return {
      email: verifiedUser.email,
      emailVerified: verifiedUser.verified,
    };
  }

  /**
   * passwordResetRequest
   */
  public async passwordResetRequest(userId: string, fullURL: string) {
    const user = await this.UserService.getFullUserById(userId);

    if (user.verified === false) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'only verified users can reset their password');
    }

    const secretTokenLength = Number(process.env.USER_SECRET_TOKEN_LENGTH);
    const secretToken = cryptoHelper.generateRandomString(secretTokenLength);

    user.secretToken = secretToken;
    user.passwordResetRequest = true;
    const updatedUser = await user.save();

    const encryptedEmail = cryptoHelper.encryptData(updatedUser.email, 'utf-8', 'hex');

    const tokenExpiry = 60 * 60; // one hour
    const passwordJWT = token.createToken({ secret: secretToken }, tokenExpiry).token;
    const passwordToken = cryptoHelper.encryptData(passwordJWT, 'utf-8', 'hex');

    const passwordResetURL = `${fullURL}/${encryptedEmail}/${passwordToken}`;

    await this.EmailService.sendPasswordResetMail(
      updatedUser.email,
      updatedUser.firstName,
      passwordResetURL,
    );

    return {
      sendPasswordResetEmail: updatedUser.passwordResetRequest,
    };
  }

  /**
   * validatePasswordReset
   */
  public async validatePasswordReset(encryptedEmail: string, passwordToken: string) {
    const passwordJWT = cryptoHelper.decryptData(passwordToken, 'hex', 'utf-8');
    const payload: Token | JsonWebTokenError = await token.verifyToken(passwordJWT);

    const errorMessage =
      'failed to grant password reset permissions, possibly link is invalid, expired or wrong credentials';

    if (payload instanceof JsonWebTokenError) {
      throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
    }

    const usersEmail = cryptoHelper.decryptData(encryptedEmail, 'hex', 'utf-8');

    const user = await this.UserService.getFullUserByEmail(usersEmail);

    if (user.passwordResetRequest === false) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'user made no request to reset password');
    }

    const recievedSecret = payload.secret;

    if (recievedSecret !== user.secretToken) {
      throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
    }

    user.grantPasswordReset = true;
    const updatedUser = await user.save();

    const base64SecretToken = cryptoHelper.encryptData(recievedSecret, 'utf-8', 'base64');

    return {
      grantPasswordReset: updatedUser.grantPasswordReset,
      passwordToken: base64SecretToken,
    };
  }

  /**
   * resetPassword
   */
  public async resetPassword(userId: string, passwordToken: string, newPassword: string) {
    const user = await this.UserService.getFullUserById(userId);
    if (
      user.verified === false ||
      user.grantPasswordReset === false ||
      user.passwordResetRequest === false
    ) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'password reset failed, user not verified or has no permission to reset password',
      );
    }

    if (passwordToken !== user.secretToken) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid credentials');
    }

    const existingPassword = await user.isValidPassword(newPassword);
    if (existingPassword) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'unacceptable credentials');
    }
    //! imporvement: avoid permitting default & weak passwords (ref: OWASP AO7)

    user.password = newPassword;
    user.passwordResetRequest = false;
    user.grantPasswordReset = false;
    user.secretToken = '';

    await user.save();

    return {
      successfulPasswordReset: true,
    };
  }

  /**
   * cancelPasswordReset
   */
  public async cancelPasswordReset(userId: string, passwordToken: string) {
    const user = await this.UserService.getFullUserById(userId);

    if (user.passwordResetRequest === false || user.grantPasswordReset === false) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'password reset request not recived or permission not granted',
      );
    }
    if (passwordToken !== user.secretToken) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'invalid credentials');
    }

    user.passwordResetRequest = false;
    user.grantPasswordReset = false;
    user.secretToken = '';
    await user.save();

    return { passwordResetCanceled: true };
  }
}

export default AuthService;
