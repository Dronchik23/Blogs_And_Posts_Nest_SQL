import { Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { BanStatus } from '../types and models/types';

@Injectable()
export class QueryParamsMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const defaultSortBy = 'createdAt';
    req.query.sortBy = req.query.sortBy
      ? req.query.sortBy.toString()
      : defaultSortBy;

    const defaultPageNumber = 1;
    req.query.pageNumber = req.query.pageNumber
      ? req.query.pageNumber.toString()
      : defaultPageNumber.toString();

    const defaultPageSize = 10;
    req.query.pageSize = req.query.pageSize
      ? req.query.pageSize.toString()
      : defaultPageSize.toString();

    const defaultSortDirection = 'desc';
    req.query.sortDirection = req.query.sortDirection
      ? req.query.sortDirection.toString()
      : defaultSortDirection;

    const banStatus = BanStatus.all;
    req.query.banStatus = req.query.banStatus
      ? req.query.banStatus.toString()
      : banStatus;

    next();
  }
}
