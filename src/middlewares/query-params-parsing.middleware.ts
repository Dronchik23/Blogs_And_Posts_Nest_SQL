import { Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { query } from 'express-validator';

const queryPageNumberValidation = query('pageNumber').toInt(10).default(1);
const queryPageSizeValidation = query('pageSize').toInt(10).default(10);

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
    next();
  }
}

export const queryParamsMiddleware = [
  queryPageNumberValidation,
  queryPageSizeValidation,
  QueryParamsMiddleware, // регистрация middleware
];
