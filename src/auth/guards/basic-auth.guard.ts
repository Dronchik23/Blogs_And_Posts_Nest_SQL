import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BasicStrategy } from 'passport-http';

@Injectable()
export class BasicAuthStrategy extends PassportStrategy(BasicStrategy) {
  constructor() {
    super();
  }

  async validate(username: string, password: string) {
    if (username === 'admin' && password === 'qwerty') {
      return { username };
    }
    throw new UnauthorizedException();
  }
}
