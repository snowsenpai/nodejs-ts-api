import { TPaginationOptions } from '@/middlewares/pagination.middleware';

export interface PublicResource {
  paginationOptions(): Promise<TPaginationOptions>;
}
