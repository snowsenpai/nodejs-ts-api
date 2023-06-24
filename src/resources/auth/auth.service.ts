import crypto from 'crypto';
import { Response } from 'express';
import * as OTPAuth from 'otpauth';
import * as QRCOde from 'qrcode';
import { PassThrough } from 'stream';
import { encode } from 'hi-base32';
import UserService from "../user/user.service";
import logger from '@/utils/logger';
import { Unauthorized } from '@/utils/exceptions/clientErrorResponse';

class AuthService {
  public UserService = new UserService();
  
  /**
   * generateRandomBase32
   */
  public generateRandomBase32() {
    const buffer = crypto.randomBytes(15);
    const base32 = encode(buffer).replace(/=/g, "").substring(0, 24);
    return base32;
  }

  /**
   * generateTOTP
   */
  public generateTOTP(secret: string) {
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
    logger.info({user}, 'user in authservice');

    const base32_secret = this.generateRandomBase32();

    // new time-based otp
    let totp = this.generateTOTP(base32_secret);

    let otp_url = totp.toString();
    logger.info({otp_url, base32_secret}, 'otp_url and base32_secret');

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
   * validateOTP
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
   * otpStatus
   */
  public otpStatus(userId: string) {
    // get user.otp_enabled
    // throw 401 not enabled
  }

  /**
   * generateQRCode
   */
  public async generateQRCode(userId: string, res: Response) {
    // get user
    // check if user.otp_enabled
    // get user.otp_auth_url
    const otp_auth_url = userId;
    
    const qrStream = new PassThrough();
    await QRCOde.toFileStream(qrStream, otp_auth_url, {
      width: 200
    });
    
    qrStream.pipe(res);
  }
  //TODO qrcode logo || otp_auth_url logo, generateTOTP() options{ label: user.email }
}

export default AuthService;
