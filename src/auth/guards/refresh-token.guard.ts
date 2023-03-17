import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { JwtService } from '../../jwt/jwt.service';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const refreshToken = req.cookies && req.cookies.refreshToken;
    // console.log(req.cookies);
    if (!refreshToken) throw new UnauthorizedException();
    const payload: any = await this.jwtService.getPayloadByRefreshToken(
      refreshToken,
    );
    //console.log('payload', payload);
    if (!payload) throw new UnauthorizedException();
    const userId = payload.userId;
    const user = await this.usersService.getUserByUserId(userId);
    if (!user) throw new UnauthorizedException();
    req.user = user;
    req.jwtPayload = {
      userId,
      deviceId: payload.deviceId,
      iat: payload.iat,
    };
    return true;
  }
}
