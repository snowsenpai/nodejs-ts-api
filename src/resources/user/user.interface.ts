import { Document } from 'mongoose';

export default interface User extends Document {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: string;
  verified: boolean;
  secret_token: string;
  password_reset_request: boolean;
  grant_password_reset: boolean;
  otp_enabled: boolean;
  otp_verified: boolean;
  otp_base32: string;
  otp_auth_url: string;
  recovery_codes: {
    hash: string,
    used: boolean
  }[]

  isValidPassword(password: string): Promise<Error | boolean>;
}
