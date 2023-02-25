import { Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RateLimiterMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    next();
  }
}
