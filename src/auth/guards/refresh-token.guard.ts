import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CustomJwtService } from '../../jwt/jwt.service';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: CustomJwtService,

    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const refreshToken = req.cookies && req.cookies.refreshToken;
    if (!refreshToken) throw new UnauthorizedException();
    const payload: any = await this.jwtService.getPayloadByRefreshToken(
      refreshToken,
    );
    if (!payload) throw new UnauthorizedException();
    const userId = payload.userId;
    const user = await this.usersQueryRepository.findUserByUserId(userId);
    if (!user) throw new UnauthorizedException();
    req.user = user;
    req.jwtPayload = {
      userId,
      deviceId: payload.deviceId,
      iat: payload.iat,
      refreshToken,
    };
    return true;
  }
}
