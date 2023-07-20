import User from '@/resources/user/user.interface';
// use a serialized user instead of the full user object

declare global {
  namespace Express {
    export interface Request {
      user: User;
      password_reset_secret: string;
    }
  }
}
