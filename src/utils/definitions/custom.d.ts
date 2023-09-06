import User from '@/resources/user/user.interface';
import { TPaginationDetails } from '@/middleware/pagination.middleware';

declare global {
  namespace Express {
    export interface Request {
      user?: User;
      passwordResetSecret?: string;
      paginationDetails?: TPaginationDetails;
      completeUrl?: string;
    }
  }
}
