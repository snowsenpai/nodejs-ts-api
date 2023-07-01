import { randomBytes } from 'crypto';
import { Response } from 'express';
import * as OTPAuth from 'otpauth';
import * as QRCOde from 'qrcode';
import { PassThrough } from 'stream';
import { encode } from 'hi-base32';
import { hash, compare } from 'bcrypt';
import UserService from "../user/user.service";
import { Unauthorized } from '@/utils/exceptions/clientErrorResponse';
import { hashedRecoveryCodes } from './auth.types';

class AuthService {
  public UserService = new UserService();
  
  /**
   * generateRandomBase32
   */
  public generateRandomBase32() {
    const buffer = randomBytes(15);
    const base32 = encode(buffer).replace(/=/g, "").substring(0, 24);
    return base32;
  }

  /**
   * generateTOTP
   */
  public generateTOTP(secret: string) {
    //TODO generateTOTP(secret, options?), options?:{ label: user.email, }
    let newTOTP = new OTPAuth.TOTP({
      issuer: process.env.APP_NAME,
      label: process.env.APP_LABEL,
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
    let totp = this.generateTOTP(base32_secret);

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

    let totp = this.generateTOTP(secret);
    
    let delta = totp.validate({ token });

    if(delta === null) {
      throw new Unauthorized('Token is invalid or user does not exist'); 
    }
    
    // update user
    user.otp_enabled = true;
    user.otp_verified = true;
    const updatedUser = await user.save();

    // generate recovery codes
    // hash recovery codes
    // save hasded codes to user doc
    return {
      otp_verified: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        otp_enabled: updatedUser.otp_enabled
      }
    }
  }

  /**
   * validate otp codes generated by user's authenticator app
   */
  public async validateOTP(userId: string, token: string) {
    const user = await this.UserService.findById(userId);
    const secret = user.otp_base32;

    let totp = this.generateTOTP(secret);

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

    let totp = this.generateTOTP(secret);

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
   */
  public async otpData(userId: string) {
    const user = await this.UserService.findById(userId);
    const enabled = user.otp_enabled;
    if(!enabled) throw new Unauthorized('User otp not enabled');
    
    // based on users otp status return certain data
    return {
      otp_auth_url: user.otp_auth_url,
      otp_base32: user.otp_base32
    }
  }

  /**
   * send data as qrcode
   * a qrcode fileStream is created and piped to the response object 
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
   * generateRandomString
   */
  public generateRandomString(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const characterCount = characters.length

    const bytes = randomBytes(length);
    let randomString = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = bytes[i] % characterCount;
      console.log('bytes[i] ', bytes[i]);
      console.log('randomIndex ', randomIndex);

      randomString += characters.charAt(randomIndex);
    }

    return randomString;
  }

  /**
   * generateRandomStringArray
   * Recovery codes for 2fa enabled accounts
   */
  public generateRecoveryCodes(length: number, count: number) {
    const randomStrings = [];

    for (let i = 0; i < count; i++) {
      const randomString = this.generateRandomString(length);
      randomStrings.push(randomString);
    }

    return randomStrings;
  }

  /**
   * hashStrings
   * hash recovery codes of user
   */
  public async hashRecoveryCodes(recoveryCodes: string[]) {
    // await the result of the iterable code
    const hashedCodes = await Promise.all(
      // iterate over the array
      recoveryCodes.map( async (code) => {
        // hash each code and return an object with a 'used' property
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
   * validateRecoveryCodes
   * if no match is found will return `undefined`
   */
  public async validateRecoveryCodes(recoverCode: string, hashedCode: hashedRecoveryCodes) {
    // const user = await this.UserService.findById(userId);
    for (const code of hashedCode) {
      const isMatch = await compare(recoverCode, code.hash);

      // using `if(!isMatch)` will exit the loop fast if a        
      // match is not found after the first iteration
      if (isMatch) {
        if (code.used) {
          // throw 403
          return {validCode: false, message: 'code already used'}
        } else {
          code.used = true;
          // save updated code to users recoveryCodes
          return {validCode: true, message: 'code valid'}
        }
      }
    }
  }
}

export default AuthService;
