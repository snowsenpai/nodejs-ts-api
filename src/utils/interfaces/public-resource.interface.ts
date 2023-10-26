import { TPaginationOptions } from '@/middleware/pagination.middleware';

export interface PublicResource {
  paginationOptions(): Promise<TPaginationOptions>;
}
