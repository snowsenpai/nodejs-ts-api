import { Request, Response, NextFunction, RequestHandler } from 'express';
import { HttpException, HttpStatus } from '@/utils/exceptions/index';

export type TPaginationOptions = {
  defaultFilter: string,
  filters: TFilters,
  defaultSort: string,
};
export type TFilters = {
  [filterName: string]: string[]
}

//! TsortBy is tightly coupled to Mongoose T<SortOrder>
export type TSortBy = { [key: string]: SortOrder}
export type SortOrder = -1 | 1 | 'asc' | 'ascending' | 'desc' | 'descending';

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

      // URL?page=1&limit=3&filter=filterName,sortOrder&search=value&filterValue=a,b,c
      // cast query index to 'string' to prevent type errors from req.query types
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 5;
      const search = (req.query.search as string) || '';

      let filter: string | string[] = (req.query.filter as string) || paginate.defaultFilter;

      req.query.filter ? (filter = (req.query.filter as string).split(',')) : (filter = [filter]);

      const filterField = filter[0];

      let filterValue: string | string[] = (req.query.filterValue as string) || 'All';

      // based on 'filterName', set a corresponding filterValue(string[]) i.e T<paginationOptions.filters.filterName>
      let matchedValue: string[];

      if (filter[0] in paginate.filters) {
        const matchedKey = filter[0];
        matchedValue = paginate.filters[matchedKey];
      } else {
        throw new HttpException(HttpStatus.BAD_REQUEST, `filter option '${filter[0]}' is invalid`);
      }

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
      next(error);
    }
  }
}

export default paginationMiddleware;
//! improvements:
//* handling filter for other fields e.g dateField (createdAt for mongodb) or year and their filterValues
//* search field ('title') should be dev defined or retrieved from a dynamic queryOption(s) e.g 'searchBy'
// e.g can query based on title, location name, etc, validation should be in place for available fields
//* can extend TPaginationOptions so services can define default page, limit, filterValue (and search?)
//* query parameter validation for 'filterName' and 'filterValue' against defined values