import { Request, Response, NextFunction, RequestHandler } from 'express';
import { BadRequest } from '@/utils/exceptions/client-errors.utils';

type TPaginationOptions = {
  defaultFilter: string,
  filters: TFilters,
  defaultSort: string,
};
type TFilters = {
  [filterName: string]: string[]
}
type TSortBy = Record<string, string>

export type TPaginationDetails = {
  page: number,
  limit: number,
  search: string,
  filterValue: string[],
  sortBy: TSortBy,
}

function paginationMiddleware(paginationOptions: TPaginationOptions): RequestHandler {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = Number(req.query.page) || 0;
      const limit = Number(req.query.limit) || 5;
      const search = String(req.query.search) || '';

      // uri?filter=filterName,sortOrder || filter=filterName
      let filter: string | string[] = String(req.query.filter) || paginationOptions.defaultFilter;

      req.query.filter ? (filter = (req.query.filter as string).split(',')) : (filter = [filter]);

      let filterValue: string | string[] = String(req.query.filterValue) || 'All';
      // req.query.filterValues should match filterOptions

      // based on filterName used, set a corresponding filterValue: string[] i.e T<paginationOptions.filters.filterName>
      let matchedValue: string[] | undefined;

      if (filter[0] in paginationOptions.filters) {
        const matchedKey = filter[0];
        matchedValue = paginationOptions.filters[matchedKey];
      } else {
        throw new BadRequest('Filter option is invalid');
      }

      // use 'as string' to fix type error from req.query types
      filterValue === 'All' ? (filterValue = [...matchedValue]) : (filterValue = (req.query.filterValue as string).split(','));

      let sortBy: TSortBy = {};
      if (filter[1]) {
        sortBy[filter[0]] = filter[1];
      } else {
        sortBy[filter[0]] = paginationOptions.defaultSort;
      }

      req.paginationDetails = {
        page,
        limit,
        search,
        filterValue,
        sortBy
      }

      return next();
    } catch (error) {
      return next(error);
    }
  }
}

export default paginationMiddleware;
