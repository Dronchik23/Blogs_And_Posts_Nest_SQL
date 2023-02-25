import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../jwt/jwt.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class UserIdFromTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const auth = req.headers.authorization;
    console.log('auth', auth);
    if (!auth) {
      req.userId = null;
      return next();
    }
    const authType = auth.split(' ')[0];
    if (authType !== 'Bearer') {
      req.userId = null;
      return next();
    }
    const token = auth.split(' ')[1];
    console.log('getUserIdFromToken token', token);
    const userId = await this.jwtService.getUserIdByToken(token);
    console.log('getUserIdFromToken userId', userId);
    if (!userId) {
      req.userId = null;
      return next();
    }
    const user = await this.usersService.getUserByUserId(userId);
    if (!user) {
      req.userId = null;
      return next();
    }
    req.userId = user.id;

    return next();
  }
}
