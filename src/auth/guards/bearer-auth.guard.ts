import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { settings } from '../../jwt/jwt.settings';
import { UsersRepository } from '../../sa/users/users-repository.service';

export type BearerJwtPayloadType = {
  iat: number;
  exp: number;
  userId: string;
};
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersRepository: UsersRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: settings.JWT_SECRET,
    });
  }
  async validate(payload: BearerJwtPayloadType) {
    const user = await this.usersRepository.findUserByUserId(payload.userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
