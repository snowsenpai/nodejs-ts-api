import crypto from 'crypto';
import * as OTPAuth from 'otpauth';
import { encode } from 'hi-base32';
import UserService from "../user/user.service";
import UserModel from '../user/user.model';
import logger from '@/utils/logger';
import { Unauthorized } from '@/utils/exceptions/clientErrorResponse';

class AuthService {
  public UserService = new UserService();
  public user = UserModel;
  
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
    user.two_factor.otp_auth_url = otp_url;
    user.two_factor.otp_base32 = base32_secret;
    await user.save();

    return { otp_url, base32_secret };
  }

  /**
   * verifyOTP
   */
  public async verifyOTP(userId: string, token: string) {
    const user = await this.UserService.findById(userId);
    const secret = user.two_factor.otp_base32;

    let totp = this.generateTOTP(secret);
    
    let delta = totp.validate({ token });

    if(delta === null) {
      throw new Unauthorized('Token is invalid or user does not exist'); 
    }
    
    // update user
    user.two_factor.otp_enabled = true;
    user.two_factor.otp_verified = true;
    const updatedUser = await user.save();

    return {
      otp_verified: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        otp_enabled: updatedUser.two_factor.otp_enabled
      }
    }
  }

  /**
   * validateOTP
   */
  public async validateOTP(userId: string, token: string) {
    const user = await this.UserService.findById(userId);
    const secret = user.two_factor.otp_base32;


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
    const { otp_verified } = await this.verifyOTP(userId, token);

    // if !otp_verified this.verifyOTP will throw an error
    if(otp_verified) {
      const user = await this.UserService.findById(userId);

      user.two_factor.otp_enabled = false;
      user.two_factor.otp_verified = false;
      user.two_factor.otp_base32 = '';
      user.two_factor.otp_auth_url = '';

      const updatedUser = await user.save();

      return {
        otp_disabled: true,
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          otp_enabled: updatedUser.two_factor.otp_enabled
        }
      }
    }
  }
}

export default AuthService;
