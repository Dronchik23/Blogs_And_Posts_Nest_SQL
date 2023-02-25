import { Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../users/users.service';
import { JwtService } from '../jwt/jwt.service';

@Injectable()
export class AuthJwtMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const auth = req.headers.authorization;
    if (!auth) {
      res.sendStatus(401);
      return;
    }
    const authType = auth.split(' ')[0];
    if (authType !== 'Bearer') {
      return res.sendStatus(401);
    }

    const token = auth.split(' ')[1];
    console.log('token authJwtMiddleware', token);
    const userId = await this.jwtService.getUserIdByToken(token);
    if (userId) {
      req.userId = userId;
      req.user = await this.usersService.getUserByUserId(userId);
      return next();
    }
    return res.sendStatus(401);
  }
}
