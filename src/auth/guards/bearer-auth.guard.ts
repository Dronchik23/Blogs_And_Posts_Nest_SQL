import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { settings } from '../../jwt/jwt.settings';
import { UsersRepository } from '../../users/users.repository';

export type BearerJwtPayloadType = {
  iat: number;
  exp: number;
  userId: string;
};
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userRepo: UsersRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: settings.JWT_SECRET,
    });
  }
  async validate(payload: BearerJwtPayloadType) {
    const user = await this.userRepo.findUserByUserId(payload.userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
