import { Request, Response, NextFunction, RequestHandler } from 'express';
import { BadRequest } from '@/utils/exceptions/client-errors.utils';

export type TPaginationOptions = {
  defaultFilter: string,
  filters: TFilters,
  defaultSort: string,
};
type TFilters = {
  [filterName: string]: string[]
}

// TsortBy is tightly coupled to Mongoose T<SortOrder>
type TSortBy = { [key: string]: SortOrder}
type SortOrder = -1 | 1 | 'asc' | 'ascending' | 'desc' | 'descending';

export type TPaginationDetails = {
  page: number,
  limit: number,
  search: string,
  filterValue: string[],
  filterField: string,
  sortBy: TSortBy,
}

function paginationMiddleware(paginationOptions: Promise<TPaginationOptions>): RequestHandler {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const paginate = await paginationOptions;
      // can extend TPaginationOptions so services can define default page, limit
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 5;
      const search = String(req.query.search) || '';

      // uri?filter=filterName,sortOrder || filter=filterName
      let filter: string | string[] = String(req.query.filter) || paginate.defaultFilter;

      req.query.filter ? (filter = (req.query.filter as string).split(',')) : (filter = [filter]);

      const filterField = filter[0];

      let filterValue: string | string[] = String(req.query.filterValue) || 'All';

      // based on filterName used, set a corresponding filterValue: string[] i.e T<paginationOptions.filters.filterName>
      let matchedValue: string[] | undefined;

      if (filter[0] in paginate.filters) {
        const matchedKey = filter[0];
        matchedValue = paginate.filters[matchedKey];
      } else {
        throw new BadRequest('Filter option is invalid');
      }

      // use 'as string' to fix type error from req.query types
      filterValue === 'All' ? (filterValue = [...matchedValue]) : (filterValue = (req.query.filterValue as string).split(','));

      let sortBy: TSortBy = {};
      if (filter[1]) {
        sortBy[filter[0]] = (filter[1] as SortOrder);
      } else {
        sortBy[filter[0]] = (paginate.defaultSort as SortOrder);
      }

      req.paginationDetails = {
        page,
        limit,
        search,
        filterValue,
        filterField,
        sortBy,
      }

      next();
    } catch (error) {
      res.status(400).send({error})
    }
  }
}

export default paginationMiddleware;
