import { randomBytes } from 'crypto';
import { Response } from 'express';
import * as OTPAuth from 'otpauth';
import * as QRCOde from 'qrcode';
import { PassThrough } from 'stream';
import { encode } from 'hi-base32';
import { hash, compare } from 'bcrypt';
import { JsonWebTokenError } from 'jsonwebtoken';
import UserService from "../user/user.service";
import EmailService from '../email/email.service';
import token from '@/utils/token';
import { Token } from '@/utils/interfaces/token.interface';
import { Unauthorized, Forbidden, NotFound, BadRequest } from '@/utils/exceptions/clientErrorResponse';
import { 
  encryptData,
  decryptData,
  generateRandomString,
  randomStringArray
} from '@/utils/crypto_helpers';

class AuthService {
  public UserService = new UserService();
  private EmailService = new EmailService();
  
  /**
   * generateRandomBase32
   */
  public generateRandomBase32() {
    // keep using hi-base32 or write custom fn?
    //TODO verify TOTP.secret, for encodeing type and bytesize if any
    const buffer = randomBytes(15);
    const base32 = encode(buffer).replace(/=/g, "").substring(0, 24);
    return base32;
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
    const user = await this.UserService.findById(userId);

    const base32_secret = this.generateRandomBase32();

    // new time-based otp
    let totp = this.generateTOTP(base32_secret, user.email);

    let otp_url = totp.toString();

    // update user otp_auth_url and otp_base32
    user.otp_auth_url = otp_url;
    user.otp_base32 = base32_secret;
    await user.save();

    return { otp_url, base32_secret };
  }

  /**
   * verifyOTP
   */
  public async verifyOTP(userId: string, token: string) {
    const user = await this.UserService.findById(userId);
    const secret = user.otp_base32;

    let totp = this.generateTOTP(secret, user.email);

    let delta = totp.validate({ token });

    if(delta === null) {
      throw new Unauthorized('Token is invalid or user does not exist'); 
    }

    // update user data
    user.otp_enabled = true;
    user.otp_verified = true;
    
    // generate recovery codes
    const codeLength = 8;
    const recoveryCodesSize = 10;

    const recoveryCodes = randomStringArray(codeLength, recoveryCodesSize);
    // hash recovery codes
    const hashedRecoveryCodes = await this.hashRecoveryCodes(recoveryCodes);
    // save hasded codes to user doc
    user.recoveryCodes = hashedRecoveryCodes;

    const updatedUser = await user.save();

    return {
      otp_verified: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        otp_enabled: updatedUser.otp_enabled
      },
      recoveryCodes: updatedUser.recoveryCodes
    }
  }

  /**
   * validate otp codes generated by user's authenticator app
   */
  public async validateOTP(userId: string, token: string) {
    const user = await this.UserService.findById(userId);
    const secret = user.otp_base32;

    let totp = this.generateTOTP(secret, user.email);

    let delta = totp.validate({ token, window: 1 });

    if(delta === null) {
      throw new Unauthorized('Token is invalid or user does not exist');
    }

    return { otp_valid: true };
  }

  /**
   * disabelOTP
   */
  public async disabelOTP(userId: string, token: string) {
    const user = await this.UserService.findById(userId);
    const secret = user.otp_base32;

    let totp = this.generateTOTP(secret, user.email);

    let delta = totp.validate({ token, window: 1 });

    if(delta === null) {
      throw new Unauthorized('Token is invalid or user does not exist');
    }

    user.otp_enabled = false;
    user.otp_verified = false;
    user.otp_base32 = '';
    user.otp_auth_url = '';

    const updatedUser = await user.save();

    return {
      otp_disabled: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        otp_enabled: updatedUser.otp_enabled
      }
    }
  }

  /**
   * otpData
   * get user's otp data if enabled
   */
  public async otpData(userId: string) {
    const user = await this.UserService.findById(userId);
    // after generateOTP() auth_url will be defined
    const enabled = user.otp_auth_url;
    if(!enabled) throw new Unauthorized('User otp not enabled');

    // based on users otp status return otp data
    return {
      otp_auth_url: user.otp_auth_url,
      otp_base32: user.otp_base32
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
    const user = await this.UserService.findById(userId);
    const recoveryCodes = user.recoveryCodes;

    for (const code of recoveryCodes) {
      const isMatch = await compare(recoverCode, code.hash);

      // using `if(!isMatch) or if-else` will exit the loop        
      // fast if a match is not found after first iteration
      if (isMatch) {
        if (code.used) {
          throw new Forbidden('Code already used');
        } else {
          code.used = true;
          await user.save();

          return {validCode: true, message: 'valid code'};
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
      throw new Forbidden('Code does not exist');
    }
    return result;
  }
// TODO user strict boolean checks in guard clause, obj.var === false <= !obj.var
  /**
   * verifyEmail
   */
  public async verifyEmail(userId: string) {
    // id should come from req.user._id
    const user = await this.UserService.findById(userId);
    // findById method handles null error

    if (user.verified) {
      throw new BadRequest('User is already verified');
    }

    // TODO use secretTokenLength = Number(process.env.USER_SECRET_TOKEN_LENGTH)
    const lengthOfSecretToken = 120;
    const secret_token = generateRandomString(lengthOfSecretToken);

    // set generated secret_token to user.secret_token and save updated user
    user.secret_token = secret_token;
    const updatedUser = await user.save();

    // when testing can use lower duration
    const tokenExpiry = 60 * 60; // seconds in an hour
    const emailToken = (token.createToken({ secret: secret_token }, tokenExpiry)).token;
    //TODO encrypt jwt? make token in url less obvious as being a jwt

    const encryptedUserEmail = encryptData(updatedUser.email, 'utf-8', 'hex');
    // when validating email should be decryted

    // in production could be full domain or api sub domain
    const appDomain = process.env.APP_DOMAIN || 'http://localhost:3000'
    // https: //appName.com/api/auth/validate/email/:email/:token req.param => email, token
    const verificationURL = `${appDomain}/api/auth/validate/email/${encryptedUserEmail}/${emailToken}`

    await this.EmailService.sendVerifyMail(updatedUser.email, updatedUser.name, verificationURL)

    const message = 'A verification link has been sent to your email';
    return message;
  }

  /**
   * validateEmail
   * @param encryptedEmail encrypted `hex` string
   * @param emailToken jwt `Token`
   */
  public async validateEmail(encryptedEmail: string, emailToken: string) {
    const payload: Token | JsonWebTokenError = await token.verifyToken(emailToken);

    const errorMesage = 'Verification failed, possibly link is invalid or expired';

    // if jsonwebtokenError, jwt is either expired, malformed or fake
    if (payload instanceof JsonWebTokenError) {
      throw new BadRequest(errorMesage);
    }

    const unverifiedUserEmail = decryptData(encryptedEmail, 'hex', 'utf-8');

    // find a user with the decrypted email
    const existingUser = await this.UserService.findByEmail(unverifiedUserEmail);

    // useful if block?
    // depends on chances of an attacker cracking secret and key used in encryption
    if (!existingUser) {
      throw new NotFound('User with that email does not exist')
    }

    const activeVerifiedUser = existingUser.verified;
    const validUserSecert = existingUser.secret_token;
    const recievedSecret = payload.secret;

    // if user already verified
    // TODO no need to check for empty string
    if (activeVerifiedUser || validUserSecert === '') {
      throw new BadRequest('User is already verified');
    }
    // recived secret must equal to original secret generated and stored
    // if not equal then recived secret might be malformed or fake
    if (recievedSecret !== validUserSecert) {
      throw new BadRequest(errorMesage)
    }

    existingUser.verified = true;
    // 'delete' generated secret from user documnet
    existingUser.secret_token = '';

    const verifiedUser = await existingUser.save();

    return {
      sucess_message: 'Your email account has been verified',
      verified_user: verifiedUser.verified,
      email: verifiedUser.email
    }
  }

  /**
   * passwordResetRequest
   */
  public async passwordResetRequest(userId: string) {
    const user = await this.UserService.findById(userId);

    if (!user.verified) {
      throw new Forbidden('Only verified users can reset their password');
    }

    const secretTokenLength = Number(process.env.USER_SECRET_TOKEN_LENGTH);
    const secret_token = generateRandomString(secretTokenLength);

    user.secret_token = secret_token;
    user.password_reset_request = true;
    const updatedUser = await user.save();

    const encryptedEmail = encryptData(updatedUser.email, 'utf-8', 'hex');

    const tokenExpiry = 60 * 60; // one hour
    // TODO encrypt jwt passwordToken as base64?
    const passwordToken = (token.createToken({ secret: secret_token }, tokenExpiry)).token;

    // frontend integration, frontend get endpoint, frontend will parse req params and send backend via api request
    const appDomain = process.env.APP_DOMAIN || 'http://localhost:3000';
    const passwordResetURL = `${appDomain}/api/auth/validate/password-reset-request/${encryptedEmail}/${passwordToken}`;

    await this.EmailService.sendPasswordResetMail(updatedUser.email, updatedUser.name, passwordResetURL);

    const message = 'Password reset email has been sent';
    return { message };
  }

  /**
   * validatePasswordReset
   */
  public async validatePasswordReset(encryptedEmail: string, passwordToken: string) {
    const payload: Token | JsonWebTokenError = await token.verifyToken(passwordToken);

    const errorMessage = 'Failed to grant password reset permissions, possibly link is invalid, expired or wrong credentials'

    if (payload instanceof JsonWebTokenError) {
      throw new BadRequest(errorMessage);
    }

    const usersEmail = decryptData(encryptedEmail, 'hex', 'utf-8');

    const user = await this.UserService.findByEmail(usersEmail);

    if (!user) {
      throw new NotFound('User with that email does not exist');
    }

    if (!user.password_reset_request) {
      throw new BadRequest('User made no request to reset password');
    }

    const recievedSecret = payload.secret;
    const validUserSecert = user.secret_token;

    if (recievedSecret !== validUserSecert) {
      throw new BadRequest(errorMessage);
    }

    user.grant_password_reset = true;
    const updatedUser = await user.save();

    const base64SecretToken = encryptData(recievedSecret, 'utf-8', 'base64');

    return {
      grant_password_reset: updatedUser.grant_password_reset,
      base64_secret_token: base64SecretToken
    }
  }

  /**
   * resetPassword
   */
  public async resetPassword(userId: string, passwordToken: string, newPassword: string) {
    const user = await this.UserService.findById(userId);

    const errorMessage = 'Password reset failed, user not verified, has no permission to reset password or invalid credentials';

    if (!user.verified || !user.grant_password_reset || !user.password_reset_request) {
      throw new BadRequest(errorMessage);
    }

    if (passwordToken !== user.secret_token) {
      throw new BadRequest(errorMessage);
    }

    const existingPassword = await this.UserService.hasValidPassword(user.email, newPassword);
    // new password should not be old password
    if (existingPassword) {
      throw new BadRequest('Invalid password, try a different password');
    }

    // update user password and reset verification fields
    user.password = newPassword;
    user.password_reset_request = false;
    user.grant_password_reset = false;
    user.secret_token = '';

    await user.save();

    return {
      successful_password_reset: true
    }
  }

  /**
   * cancelPasswordReset
   */
  public async cancelPasswordReset(userId: string, passwordToken: string) {
    const user = await this.UserService.findById(userId);

    if (user.password_reset_request === false) {
      throw new Forbidden('Password reset request not recived');
    }
    if (user.grant_password_reset === false) {
      throw new Forbidden('Password reset permission not granted');
    }
    if (passwordToken !== user.secret_token) {
      throw new Forbidden('Invalid credentials');
    }

    user.password_reset_request = false;
    user.grant_password_reset = false;
    user.secret_token = '';
    await user.save();

    return { password_reset_canceled: true }
  }
}

export default AuthService;
