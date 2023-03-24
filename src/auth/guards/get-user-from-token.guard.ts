import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { settings } from '../../jwt/jwt.settings';
import { BearerJwtPayloadType } from '../../types and models/types';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';

@Injectable()
export class MyStrategy extends PassportStrategy(Strategy) {
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
    return user.id;
  }
}
