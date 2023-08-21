import User from '@/resources/user/user.interface';
import { TPaginationDetails } from '@/middleware/pagination.middleware';

declare global {
  namespace Express {
    export interface Request {
      user: User;
      passwordResetSecret: string;
      paginationDetails: TPaginationDetails;
      completeUrl: string;
    }
  }
}
//! improvements
//* these properties can only be defined depending on specific middleware used in route's handlers[]
// add '| undefined '? to each case?...