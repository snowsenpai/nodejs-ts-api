import { Response } from 'express';
import * as OTPAuth from 'otpauth';
import * as QRCOde from 'qrcode';
import { PassThrough } from 'stream';
import { hash, compare } from 'bcrypt';
import { JsonWebTokenError } from 'jsonwebtoken';
import UserService from "../user/user.service";
import EmailService from '../email/email.service';
import token from '@/utils/token.util';
import { Token, TokenData } from '@/utils/interfaces/token.interface';
import { Unauthorized, Forbidden, BadRequest } from '@/utils/exceptions/client-errors.utils';
import cryptoHelper from '@/utils/crypto-helpers.util';

class AuthService {
  public UserService = new UserService();
  private EmailService = new EmailService();

  /**
   * Attempt to login a user
   */
  public async login(
    email: string,
    password: string
  ): Promise<TokenData | Error> {
    const user = await this.UserService.getFullUserByEmail(email);

    const validPassword = await user.isValidPassword(password);

    if (validPassword === false) {
      throw new Unauthorized('Wrong credentials');
    }
    const accessToken = token.createToken({id: user._id});

    return accessToken;
  }

  /**
   * generateTOTP
   */
  public generateTOTP(secret: string, label?: string) {
    let newTOTP = new OTPAuth.TOTP({
      issuer: process.env.APP_NAME,
      label: label || process.env.APP_LABEL,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret
    });
    return newTOTP;
  }

  /**
   * generateOTP
  */
  public async generateOTP(userId: string) {
    const user = await this.UserService.getFullUserById(userId);

    if (user.verified === false) {
      throw new Forbidden('Only verified users can enable OTP');
    }

    const base32Secret = cryptoHelper.generateRandomBase32(24);

    // new time-based otp
    let totp = this.generateTOTP(base32Secret, user.email);

    let otpUrl = totp.toString();

    // update user otpAuthUrl and otpBase32
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
    const secret = user.otpBase32;

    let totp = this.generateTOTP(secret, user.email);

    let delta = totp.validate({ token });

    if(delta === null) {
      throw new Unauthorized('Token is invalid or user does not exist'); 
    }

    // update user data
    user.otpEnabled = true;
    user.otpVerified = true;
    
    // generate recovery codes
    const codeLength = 8;
    const recoveryCodesSize = 10;

    const recoveryCodes = cryptoHelper.randomStringArray(codeLength, recoveryCodesSize);
    // hash recovery codes
    const hashedRecoveryCodes = await this.hashRecoveryCodes(recoveryCodes);
    // save hasded codes to user doc
    user.recoveryCodes = hashedRecoveryCodes;

    const updatedUser = await user.save();

    return {
      otpVerified: true,
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        email: updatedUser.email,
        otpEnabled: updatedUser.otpEnabled
      },
      recoveryCodes
    }
  }

  /**
   * validate otp codes generated by user's authenticator app
   */
  public async validateOTP(userId: string, token: string) {
    const user = await this.UserService.getFullUserById(userId);
    const secret = user.otpBase32;

    let totp = this.generateTOTP(secret, user.email);

    let delta = totp.validate({ token, window: 1 });

    if(delta === null) {
      throw new Unauthorized('Token is invalid or user does not exist');
    }

    return { otpValid: true };
  }

  /**
   * disabelOTP
   */
  public async disabelOTP(userId: string, token: string) {
    const user = await this.UserService.getFullUserById(userId);
    const secret = user.otpBase32;

    let totp = this.generateTOTP(secret, user.email);

    let delta = totp.validate({ token, window: 1 });

    if(delta === null) {
      throw new Unauthorized('Token is invalid or user does not exist');
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
        otpEnabled: updatedUser.otpEnabled
      }
    }
  }

  /**
   * otpData
   * get user's otp data if enabled
   */
  public async otpData(userId: string) {
    const user = await this.UserService.getFullUserById(userId);
    // after generateOTP() authUrl will be defined
    const enabled = user.otpAuthUrl;
    if(!enabled) throw new Unauthorized('User otp not enabled');

    // based on users otp status return otp data
    return {
      otpAuthUrl: user.otpAuthUrl,
      otpBase32: user.otpBase32
    }
  }

  /**
   * send data as qrcode
   * a qrcode fileStream is created and piped to the response stream
   * e.g for a PaymentService
   */
  public async responseWithQRCode(data: string, res: Response) {
    const qrStream = new PassThrough();
    await QRCOde.toFileStream(qrStream, data, {
      width: 200
    });

    qrStream.pipe(res);
  }

  /**
   * hashStrings
   * hash an array of random strings as recovery codes of user
   */
  public async hashRecoveryCodes(recoveryCodes: string[]) {
    // await the result of the iterable code
    const hashedCodes = await Promise.all(
      // iterate over the array
      recoveryCodes.map( async (code) => {
        // hash each code and return an object with a 'used' property for each hash
        const hasedCode = await hash(code, 7);
        return {
          hash: hasedCode,
          used: false
        }
      })
    );
    return hashedCodes;
  }

  /**
   * validateRecoveryCode
   * if no match is found will return `undefined`
   */
  public async validateRecoveryCode(userId: string, recoverCode: string) {
    const user = await this.UserService.getFullUserById(userId);
    if (!(user.recoveryCodes.length)) {
      throw new Forbidden('User has no recover code');
    }
    const recoveryCodes = user.recoveryCodes;

    for (const code of recoveryCodes) {
      const isMatch = await compare(recoverCode, code.hash);

      // using `if(!isMatch) or if-else` will exit the loop        
      // fast if a match is not found after first iteration
      if (isMatch) {
        if (code.used) {
          throw new Forbidden(`code has been used: ${recoverCode}`);
        } else {
          code.used = true;
          await user.save();

          return { validCode: recoverCode };
        }
      }
    }
  }

  /**
   * validCode
   * handle `undefined` case from `validateRecoveryCode` method
   */
  public async validCode(userId: string, recoveryCode: string) {
    const result = await this.validateRecoveryCode(userId, recoveryCode);
    if (!result) {
      throw new Forbidden('invalid recovery code');
    }
    return result;
  }

  /**
   * updateEmail
   */
  public async updateEmail(userId: string, oldEmail: string, newEmail: string) {
    if (newEmail === oldEmail) {
      throw new BadRequest('new email should not be the same as old email');
    }

    const updatedUser = await this.UserService.updateUser(userId, { email: newEmail });

    if (updatedUser.verified === true) {
      updatedUser.verified = false;
      const oldVerifiedUser = await updatedUser.save();

      const message = await this.verifyEmail(oldVerifiedUser._id);
      return message;
    }

    return updatedUser;
  }

  /**
   * verifyEmail
   */
  public async verifyEmail(userId: string) {
    const user = await this.UserService.getFullUserById(userId);

    if (user.verified) {
      throw new BadRequest('User is already verified');
    }

    const lengthOfSecretToken = Number(process.env.USER_SECRET_TOKEN_LENGTH);
    const secretToken = cryptoHelper.generateRandomString(lengthOfSecretToken);

    // set generated secretToken to user.secretToken and save updated user
    user.secretToken = secretToken;
    const updatedUser = await user.save();

    // when testing can use lower duration
    const tokenExpiry = 60 * 60; // seconds in an hour
    const emailJWT = (token.createToken({ secret: secretToken }, tokenExpiry)).token;
    const emailToken = cryptoHelper.encryptData(emailJWT, 'utf-8', 'hex');

    const encryptedUserEmail = cryptoHelper.encryptData(updatedUser.email, 'utf-8', 'hex');
    // when validating emailToken should be decryted to get the emailjwt

    // in production could be full domain or api sub domain
    const appDomain = process.env.APP_DOMAIN! || process.env.LOCAL_HOST!;
    // https: //appName.com/api/auth/validate/email/:email/:token req.param => email, token
    const verificationURL = `${appDomain}/api/auth/validate/email/${encryptedUserEmail}/${emailToken}`

    await this.EmailService.sendVerifyMail(updatedUser.email, updatedUser.firstName, verificationURL)

    return 'A verification link has been sent to your email';
  }

  /**
   * validateEmail
   * @param encryptedEmail encrypted `hex` string
   * @param emailToken jwt `Token`
   */
  public async validateEmail(encryptedEmail: string, emailToken: string) {
    const emailJWT = cryptoHelper.decryptData(emailToken, 'hex', 'utf-8');
    const payload: Token | JsonWebTokenError = await token.verifyToken(emailJWT);

    const errorMesage = 'Verification failed, possibly link is invalid or expired';

    // if jsonwebtokenError, jwt is either expired, malformed or fake
    if (payload instanceof JsonWebTokenError) {
      throw new BadRequest(errorMesage);
    }

    const unverifiedUserEmail = cryptoHelper.decryptData(encryptedEmail, 'hex', 'utf-8');

    // find a user with the decrypted email
    const existingUser = await this.UserService.getFullUserByEmail(unverifiedUserEmail);

    const validUserSecert = existingUser.secretToken;
    const recievedSecret = payload.secret;

    // recived secret must equal to original secret generated and stored
    // if not equal then recived secret might be malformed or fake
    if (recievedSecret !== validUserSecert) {
      throw new BadRequest(errorMesage)
    }

    existingUser.verified = true;
    // 'delete' generated secret from user documnet
    existingUser.secretToken = '';

    const verifiedUser = await existingUser.save();

    return {
      verifiedUser: verifiedUser.verified,
      email: verifiedUser.email
    }
  }

  /**
   * passwordResetRequest
   */
  public async passwordResetRequest(userId: string) {
    const user = await this.UserService.getFullUserById(userId);

    if (user.verified === false) {
      throw new Forbidden('Only verified users can reset their password');
    }

    const secretTokenLength = Number(process.env.USER_SECRET_TOKEN_LENGTH);
    const secretToken = cryptoHelper.generateRandomString(secretTokenLength);

    user.secretToken = secretToken;
    user.passwordResetRequest = true;
    const updatedUser = await user.save();

    const encryptedEmail = cryptoHelper.encryptData(updatedUser.email, 'utf-8', 'hex');

    const tokenExpiry = 60 * 60; // one hour
    const passwordJWT = (token.createToken({ secret: secretToken }, tokenExpiry)).token;
    const passwordToken = cryptoHelper.encryptData(passwordJWT, 'utf-8', 'hex');

    // frontend integration, frontend get endpoint, frontend will parse req params and send backend via api request
    const appDomain = process.env.APP_DOMAIN! || process.env.LOCAL_HOST!;
    const passwordResetURL = `${appDomain}/api/auth/validate/password-reset-request/${encryptedEmail}/${passwordToken}`;

    await this.EmailService.sendPasswordResetMail(updatedUser.email, updatedUser.firstName, passwordResetURL);

    return 'a password reset email has been sent';
  }

  /**
   * validatePasswordReset
   */
  public async validatePasswordReset(encryptedEmail: string, passwordToken: string) {
    const passwordJWT = cryptoHelper.decryptData(passwordToken, 'hex', 'utf-8');
    const payload: Token | JsonWebTokenError = await token.verifyToken(passwordJWT);

    const errorMessage = 'Failed to grant password reset permissions, possibly link is invalid, expired or wrong credentials'

    if (payload instanceof JsonWebTokenError) {
      throw new BadRequest(errorMessage);
    }

    const usersEmail = cryptoHelper.decryptData(encryptedEmail, 'hex', 'utf-8');

    const user = await this.UserService.getFullUserByEmail(usersEmail);

    if (user.passwordResetRequest === false) {
      throw new BadRequest('User made no request to reset password');
    }

    const recievedSecret = payload.secret;
    const validUserSecert = user.secretToken;

    if (recievedSecret !== validUserSecert) {
      throw new BadRequest(errorMessage);
    }

    user.grantPasswordReset = true;
    const updatedUser = await user.save();

    const base64SecretToken = cryptoHelper.encryptData(recievedSecret, 'utf-8', 'base64');

    return {
      grantPasswordReset: updatedUser.grantPasswordReset,
      base64SecretToken
    }
  }

  /**
   * resetPassword
   */
  public async resetPassword(userId: string, passwordToken: string, newPassword: string) {
    const user = await this.UserService.getFullUserById(userId);

    const errorMessage = 'Password reset failed, user not verified or has no permission to reset password';

    if (user.verified === false || user.grantPasswordReset === false || user.passwordResetRequest === false) {
      throw new BadRequest(errorMessage);
    }

    if (passwordToken !== user.secretToken) {
      throw new BadRequest('invalid credentials');
    }

    const existingPassword = await user.isValidPassword(newPassword);
    // new password should not be old password
    if (existingPassword) {
      throw new BadRequest('Unacceptable password');
    }

    // update user password and reset verification fields
    user.password = newPassword;
    user.passwordResetRequest = false;
    user.grantPasswordReset = false;
    user.secretToken = '';

    await user.save();

    return {
      successfulPasswordReset: true
    }
  }

  /**
   * cancelPasswordReset
   */
  public async cancelPasswordReset(userId: string, passwordToken: string) {
    const user = await this.UserService.getFullUserById(userId);

    if (
      user.passwordResetRequest === false ||
      user.grantPasswordReset === false
      ) {
      throw new Forbidden('Password reset request not recived or permission not granted');
    }
    if (passwordToken !== user.secretToken) {
      throw new Forbidden('Invalid credentials');
    }

    user.passwordResetRequest = false;
    user.grantPasswordReset = false;
    user.secretToken = '';
    await user.save();

    return { passwordResetCanceled: true }
  }
}

export default AuthService;
