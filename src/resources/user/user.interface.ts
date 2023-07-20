import { Document } from 'mongoose';

export default interface User extends Document {
  email: string;
  name: string;
  password: string;
  role: string;
  verified: boolean;
  secret_token: string;
  password_reset_request: boolean;
  grant_password_reset: boolean;
  otp_enabled: boolean;
  otp_verified: boolean;
  otp_ascii: string;
  otp_hex: string;
  otp_base32: string;
  otp_auth_url: string;
  recoveryCodes: {
    hash: string,
    used: boolean
  }[]

  isValidPassword(password: string): Promise<Error | boolean>;
}
