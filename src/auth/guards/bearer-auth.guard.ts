import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { settings } from '../../jwt/jwt.settings';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';

export type BearerJwtPayloadType = {
  iat: number;
  exp: number;
  userId: string;
};
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: settings.JWT_SECRET,
    });
  }
  async validate(payload: BearerJwtPayloadType) {
    const user = await this.usersQueryRepository.findUserByUserId(
      payload.userId,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
