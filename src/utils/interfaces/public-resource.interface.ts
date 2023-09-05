import { TPaginationOptions } from '@/middleware/pagination.middleware';

interface PublicResource {
  paginationOptions(): Promise<TPaginationOptions>;
}

export default PublicResource;
