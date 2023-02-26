import { Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { IsInt, Min } from 'class-validator';

@Injectable()
export class QueryParamsMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const defaultSortBy = 'createdAt';
    let sortBy = req.query.sortBy;
    if (!sortBy) {
      sortBy = defaultSortBy;
    } else {
      sortBy = sortBy;
    }
    req.query.sortBy = sortBy;
    const defaultPageNumber = 1;
    let pageNumber = req.query.pageNumber;
    if (!pageNumber) {
      pageNumber = defaultPageNumber.toString();
    } else {
      pageNumber = pageNumber.toString();
    }
    req.query.pageNumber = pageNumber;

    const defaultPageSize = 1;
    let pageSize = req.query.pageSize;
    if (!pageSize) {
      pageSize = defaultPageSize.toString();
    } else {
      pageSize = pageSize.toString();
    }
    req.query.pageSize = pageSize;

    next();
  }
}
