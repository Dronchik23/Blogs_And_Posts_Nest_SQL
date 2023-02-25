import { Request, Response, NextFunction } from 'express';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '../jwt/jwt.service';

@Injectable()
export class RefreshTokenMiddleware {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(401);
    const payload: any = await this.jwtService.getPayloadByRefreshToken(
      refreshToken,
    );
    if (!payload) return res.sendStatus(401);
    const userId = payload.userId;
    const user = await this.usersService.getUserByUserId(userId);
    if (!user) return res.sendStatus(401);
    req.user = user;
    req.jwtPayload = {
      userId,
      deviceId: payload.deviceId,
      iat: payload.iat,
    };
    return next();
  }
}
