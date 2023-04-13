import { Injectable, Scope } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { settings } from './jwt.settings';
import { TokensRepository } from '../tokens/tokens.repository';
import { ConfigService } from '@nestjs/config';

@Injectable({ scope: Scope.DEFAULT })
export class CustomJwtService {
  constructor(
    private readonly tokensRepository: TokensRepository,
    private readonly configService: ConfigService,
  ) {}

  private accessTokenLifeTime = this.configService.get(
    'ACCESS_TOKEN_LIFE_TIME',
  );

  private refreshTokenLifeTime = this.configService.get(
    'REFRESH_TOKEN_LIFE_TIME',
  );

  createJWT(userId: string, deviceId: string) {
    const accessToken = jwt.sign({ userId }, settings.JWT_SECRET, {
      expiresIn: this.accessTokenLifeTime,
    });
    const refreshToken = jwt.sign(
      { userId, deviceId },
      settings.JWT_REFRESH_SECRET,
      { expiresIn: this.refreshTokenLifeTime },
    );
    return { accessToken, refreshToken };
  }

  async getPayloadByRefreshToken(refreshToken: string) {
    try {
      return jwt.verify(refreshToken, settings.JWT_REFRESH_SECRET);
    } catch (error) {
      console.log('getPayloadByRefreshToken Error: ' + error);
      return null;
    }
  }

  async addRefreshToBlackList(refreshToken: string) {
    return this.tokensRepository.addRefreshToBlackList(refreshToken);
  }

  async findBannedToken(refreshToken: string) {
    return this.tokensRepository.findBannedToken(refreshToken);
  }

  getLastActiveDate(refreshToken: string): string {
    const payload: any = jwt.verify(refreshToken, settings.JWT_REFRESH_SECRET);
    return new Date(payload.iat * 1000).toISOString();
  }
}
