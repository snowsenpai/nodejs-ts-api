import { Document } from 'mongoose';

interface OTP {
  otp_enabled: boolean,
  otp_verified: boolean,
  otp_ascii: string,
  otp_hex: string,
  otp_base32: string,
  otp_auth_url: string
}

export default interface User extends Document {
  email: string;
  name: string;
  password: string;
  role: string;
  two_factor: OTP;

  isValidPassword(password: string): Promise<Error | boolean>;
}
