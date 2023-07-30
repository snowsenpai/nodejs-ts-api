import { Document } from 'mongoose';

export default interface User extends Document {
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  verified: boolean;
  secretToken: string;
  passwordResetRequest: boolean;
  grantPasswordReset: boolean;
  otpEnabled: boolean;
  otpVerified: boolean;
  otpBase32: string;
  otpAuthUrl: string;
  recoveryCodes: {
    hash: string,
    used: boolean
  }[]

  isValidPassword(password: string): Promise<Error | boolean>;
}
