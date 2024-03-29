import { Response } from 'express';
import * as OTPAuth from 'otpauth';
import * as QRCOde from 'qrcode';
import { PassThrough } from 'stream';
import { hash, compare } from 'bcrypt';
import { JsonWebTokenError } from 'jsonwebtoken';
import { UserService } from '../user/user.service';
import { EmailService } from '../email/email.service';
import * as token from '@/utils/token.util';
import { Token } from '@/utils/interfaces/token.interface';
import { HttpException, HttpStatus } from '@/utils/exceptions/index';
import * as cryptoUtil from '@/utils/crypto.util';

/**
 * Methods for user security and authentication processes.
 *
 * Utilizes {@link UserService} for user queries and {@link EmailService} for sending emails.
 */
class AuthService {
  private UserService = new UserService();
  private EmailService = new EmailService();

  /**
   * Returns an accessToken and a boolean flag for user otp status if `email` and `password` belong to an existing user.
   * @param email - User's email.
   * @param password - User's password.
   * @throws HttpException (401) if password is invalid.
   */
  public async login(email: string, password: string) {
    const user = await this.UserService.getFullUserByEmail(email);
    // TODO check user.resetPasswordRequest, if true, throw 401, don't give access token

    const validPassword = await user.isValidPassword(password);

    if (!validPassword) {
      throw new HttpException(HttpStatus.UNAUTHORIZED, 'wrong credentials');
    }
    const accessToken = token.createToken({ id: user._id });

    //? add user.otpVerified instead, or both?
    return {
      accessToken,
      userOtpEnabled: user.otpEnabled,
    };
  }

  /**
   * Wrapper function for otpauth's TOTP class
   * @param secret - base32 Secret Key.
   * @param label - user's account label.
   * @returns the created TOTP object.
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
   * Updates a user document with otpAuthUrl and a base32Secret.
   *
   * @param userId - User id to search for.
   * @throws HttpException (401) if user is not verified.
   * @returns otpAuthUrl (Google Authenticator key URI) and base32Secret (the secret parameter in otpAuthUrl).
   */
  public async generateOTP(userId: string) {
    const user = await this.UserService.getFullUserById(userId);

    if (!user.verified) {
      throw new HttpException(HttpStatus.UNAUTHORIZED, 'only verified users can enable OTP');
    }

    const base32Secret = cryptoUtil.generateRandomBase32(24);

    const totp = this.generateTOTP(base32Secret, user.email);

    const otpUrl = totp.toString();

    user.otpAuthUrl = otpUrl;
    user.otpBase32 = base32Secret;
    await user.save();

    return { otpUrl, base32Secret };
  }

  /**
   * Validates the given otp `token`,
   * if token is valid user's document is marked as verified and updated with hashed recovery codes.
   *
   * Plain text recovery code is included in the returned data.
   * @param userId - User id to search for.
   * @param token - token to validate.
   * @throws HttpException (401) if token is invalid.
   */
  public async verifyOTP(userId: string, token: string) {
    const user = await this.UserService.getFullUserById(userId);
    //TODO check user.otpBase32 if empty/undefined
    const secret = user.otpBase32;

    const totp = this.generateTOTP(secret, user.email);

    const delta = totp.validate({ token });

    if (delta === null) {
      throw new HttpException(HttpStatus.UNAUTHORIZED, 'token is invalid');
    }

    user.otpEnabled = true;
    user.otpVerified = true;

    const recoveryCodes = cryptoUtil.randomStringArray(8, 10);

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
   * Validates otp codes generated by user's authenticator app.
   * @param userId - User id to search for.
   * @param token - token to validate.
   * @throws HttpException (401) if token is invalid.
   */
  public async validateOTP(userId: string, token: string) {
    const user = await this.UserService.getFullUserById(userId);
    //TODO check user.verified status in a middleware fn, mount after authenticatedMW
    const secret = user.otpBase32;

    const totp = this.generateTOTP(secret, user.email);

    const delta = totp.validate({ token, window: 1 });

    if (delta === null) {
      throw new HttpException(HttpStatus.UNAUTHORIZED, 'token is invalid');
    }

    return { otpValid: true };
  }

  /**
   * Resets user's otp related fields.
   * @param userId - User id to search for.
   * @param token - token to validate.
   * @throws HttpException (401) if token is invalid.
   */
  public async disableOTP(userId: string, token: string) {
    const user = await this.UserService.getFullUserById(userId);
    //TODO check user.otpVerified status in a middleware fn, mount after authenticatedMW
    const secret = user.otpBase32;

    const totp = this.generateTOTP(secret, user.email);

    const delta = totp.validate({ token, window: 1 });

    if (delta === null) {
      throw new HttpException(HttpStatus.UNAUTHORIZED, 'token is invalid');
    }

    user.otpEnabled = false;
    user.otpVerified = false;
    user.otpBase32 = '';
    user.otpAuthUrl = '';
    // recovery codes?

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
   * Returns a user's otpAuthUrl and otpBase32 data.
   * @param userId - User id to search for.
   * @throws HttpException (401) if otpAuthUrl is falsy.
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
   * Sends the given `data` as QRcode to the client.
   * @param data - String to encode in QRcode.
   * @param res - the response object.
   */
  public async responseWithQRCode(data: string, res: Response) {
    const qrStream = new PassThrough();
    await QRCOde.toFileStream(qrStream, data, {
      width: 200,
    });

    qrStream.pipe(res);
  }

  /**
   * Hashes elements within the given array, each element is modified into an object with a `hash` string and a `used` boolean property.
   * @param recoveryCodes - array of strings to hash.
   * @returns the hashed array.
   */
  public async hashRecoveryCodes(recoveryCodes: string[]) {
    const hashedCodes = await Promise.all(
      recoveryCodes.map(async (code) => {
        const hashedCode = await hash(code, 7);
        return {
          hash: hashedCode,
          used: false,
        };
      }),
    );
    return hashedCodes;
  }

  /**
   * Ensures that the given recovery code is a valid hash stored in an existing user document with id field matching `userId`.
   *
   * if no match is found `undefined` is returned.
   * @param userId - User id to search for.
   * @param recoveryCode - Recovery code string to validate.
   * @throws HttpException (404) if user has no recovery code.
   * @returns `true` of the given code is valid and has not been used.
   */
  public async validateRecoveryCode(userId: string, recoveryCode: string) {
    const user = await this.UserService.getFullUserById(userId);
    if (!user.recoveryCodes.length) {
      throw new HttpException(HttpStatus.NOT_FOUND, 'user has no recover code');
    }
    const recoveryCodes = user.recoveryCodes;

    for (const code of recoveryCodes) {
      const isMatch = await compare(recoveryCode, code.hash);

      if (isMatch) {
        if (code.used) {
          //! wrong status code
          throw new HttpException(HttpStatus.FORBIDDEN, `code has been used: ${recoveryCode}`);
        } else {
          code.used = true;
          await user.save();

          return { validCode: true, recoveryCode };
        }
      }
    }
  }

  /**
   * Ensures that the given `recoveryCode` is valid and belongs to an existing user with id field matching `userId`.
   *
   * Handles `undefined` case from `validateRecoveryCode` method.
   * @param userId - User id to search for.
   * @throws HttpException (404) if recovery code is invalid.
   */
  public async validCode(userId: string, recoveryCode: string) {
    const result = await this.validateRecoveryCode(userId, recoveryCode);
    if (!result) {
      throw new HttpException(HttpStatus.UNAUTHORIZED, 'invalid recovery code');
    }
    return result;
  }

  /**
   * Updates a user's email field with the given `newEmail`.
   *
   * If a user is verified a verification link is sent to the new email and the user is marked
   * as unverified until the new email undergoes the verification process.
   * @param userId - User id to search for.
   * @param fullUrl - The main verification url to send to user's email if user is verified.
   * @param newEmail - New email.
   * @param oldEmail - User's old email.
   * @throws HttpException (400) if new email matches the old email.
   */
  public async updateEmail(userId: string, oldEmail: string, newEmail: string, fullUrl: string) {
    if (newEmail === oldEmail) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'new email should not be the same as old email',
      );
    }

    const updatedUser = await this.UserService.updateUser(userId, { email: newEmail });

    if (updatedUser.verified) {
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
   * Creates a verification url which is sent to the user's email for email verification.
   * @param userId - User id to search for.
   * @param fullUrl - The main verification url to send to user's email if user is verified.
   * @throws HttpException (400) if user is already verified.
   */
  public async verifyEmail(userId: string, fullURL: string) {
    const user = await this.UserService.getFullUserById(userId);

    if (user.verified) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'user is already verified');
    }

    const lengthOfSecretToken = Number(process.env.USER_SECRET_TOKEN_LENGTH);
    const secretToken = cryptoUtil.generateRandomString(lengthOfSecretToken);

    user.secretToken = secretToken;
    const updatedUser = await user.save();

    const tokenExpiry = 60 * 60; // an hour
    const emailJWT = token.createToken({ secret: secretToken }, tokenExpiry).token;

    const emailToken = cryptoUtil.encryptData(emailJWT, 'utf-8', 'hex');

    const encryptedUserEmail = cryptoUtil.encryptData(updatedUser.email, 'utf-8', 'hex');

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
   * Validates that the payload of the `emailToken` matches the secret token generated for a user with corresponding `encryptedEmail`
   * @param encryptedEmail - encrypted user email.
   * @param emailToken - encrypted jwt.
   * @throws HttpException (400) if `emailToken` is invalid or expired.
   * @throws HttpException (400) if payload secret does not match user's secret token.
   */
  public async validateEmail(encryptedEmail: string, emailToken: string) {
    const emailJWT = cryptoUtil.decryptData(emailToken, 'hex', 'utf-8');
    const payload: Token | JsonWebTokenError = await token.verifyToken(emailJWT);

    const errorMessage = 'verification failed, possibly link is invalid or expired';

    if (payload instanceof JsonWebTokenError) {
      throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
    }
    // TODO deny access for verified users
    const unverifiedUserEmail = cryptoUtil.decryptData(encryptedEmail, 'hex', 'utf-8');

    const existingUser = await this.UserService.getFullUserByEmail(unverifiedUserEmail);

    if (payload.secret !== existingUser.secretToken) {
      throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
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
   * Creates a verification url which is sent to the user's email for password reset.
   * @param fullUrl - The main verification url to send to user's email if user is verified.
   * @param userId - User id to search for.
   * @throws HttpException (401) if user is not verified.
   */
  public async passwordResetRequest(userId: string, fullURL: string) {
    const user = await this.UserService.getFullUserById(userId);

    if (!user.verified) {
      throw new HttpException(
        HttpStatus.UNAUTHORIZED,
        'only verified users can reset their password',
      );
    }

    const secretTokenLength = Number(process.env.USER_SECRET_TOKEN_LENGTH);
    const secretToken = cryptoUtil.generateRandomString(secretTokenLength);

    user.secretToken = secretToken;
    user.passwordResetRequest = true;
    const updatedUser = await user.save();

    const encryptedEmail = cryptoUtil.encryptData(updatedUser.email, 'utf-8', 'hex');

    const tokenExpiry = 60 * 60; // one hour
    const passwordJWT = token.createToken({ secret: secretToken }, tokenExpiry).token;
    const passwordToken = cryptoUtil.encryptData(passwordJWT, 'utf-8', 'hex');

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
   * Validates that the payload of the `passwordToken` matches the secret token generated for a user with corresponding `encryptedEmail`
   * @param encryptedEmail - encrypted user email.
   * @param passwordToken - encrypted jwt.
   * @returns passwordToken (for passwordtoken basic header).
   * @throws HttpException (400) if `passwordToken` is invalid or expired.
   * @throws HttpException (400) if user's passwordResetRequest is false.
   * @throws HttpException (400) if payload secret does not match user's secret token.
   */
  public async validatePasswordReset(encryptedEmail: string, passwordToken: string) {
    const passwordJWT = cryptoUtil.decryptData(passwordToken, 'hex', 'utf-8');
    const payload: Token | JsonWebTokenError = await token.verifyToken(passwordJWT);

    const errorMessage =
      'failed to grant password reset permissions, possibly link is invalid, expired or wrong credentials';

    if (payload instanceof JsonWebTokenError) {
      throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
    }
    const usersEmail = cryptoUtil.decryptData(encryptedEmail, 'hex', 'utf-8');

    const user = await this.UserService.getFullUserByEmail(usersEmail);

    if (!user.passwordResetRequest) {
      throw new HttpException(HttpStatus.BAD_REQUEST, 'user made no request to reset password');
    }

    const receivedSecret = payload.secret;

    if (receivedSecret !== user.secretToken) {
      throw new HttpException(HttpStatus.BAD_REQUEST, errorMessage);
    }

    user.grantPasswordReset = true;
    const updatedUser = await user.save();

    const base64SecretToken = cryptoUtil.encryptData(receivedSecret, 'utf-8', 'base64');

    return {
      grantPasswordReset: updatedUser.grantPasswordReset,
      passwordToken: base64SecretToken,
    };
  }

  /**
   * Updates a user's password field with the given `newPassword`.
   * @param userId - User id to search for.
   * @param newPassword - User's new password.
   * @param passwordToken - Password token generated for user.
   * @throws HttpException (400) if user is unverified or made no request to reset their password or has not been granted password reset permission.
   * @throws HttpException (400) if `passwordToken` does not match the user's secret token.
   * @throws HttpException (400) if `newPassword` matches the user's current password.
   */
  public async resetPassword(userId: string, passwordToken: string, newPassword: string) {
    const user = await this.UserService.getFullUserById(userId);
    if (!user.verified || !user.grantPasswordReset || !user.passwordResetRequest) {
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
    //! improvement: avoid permitting default & weak passwords (ref: OWASP AO7)

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
   * Resets all user fields associated with the password reset process.
   * @param userId - User id to search for.
   * @param passwordToken - Password token generated for user.
   * @throws HttpException (400) if user's passwordResetRequest field or grantPasswordReset field is false.
   * @throws HttpException (400) if `passwordToken` does not match the user's secretToken.
   */
  public async cancelPasswordReset(userId: string, passwordToken: string) {
    const user = await this.UserService.getFullUserById(userId);

    if (!user.passwordResetRequest || !user.grantPasswordReset) {
      throw new HttpException(
        HttpStatus.BAD_REQUEST,
        'password reset request not received or permission not granted',
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

export { AuthService };
