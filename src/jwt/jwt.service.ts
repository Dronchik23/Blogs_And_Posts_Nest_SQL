import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { settings } from './jwt.settings';
import { TokensRepository } from '../tokens/tokens.repository';

@Injectable()
export class JwtService {
  constructor(private readonly tokensRepository: TokensRepository) {}

  createJWT(userId: string, deviceId: string) {
    const accessToken = jwt.sign({ userId }, settings.JWT_SECRET, {
      expiresIn: '10m',
    });
    const refreshToken = jwt.sign(
      { userId, deviceId },
      settings.JWT_REFRESH_SECRET,
      { expiresIn: '20m' },
    );
    return { accessToken, refreshToken };
  }

  async getUserIdByToken(token: string) {
    try {
      const result = jwt.verify(token, settings.JWT_SECRET) as {
        userId: string;
      };
      return result.userId;
    } catch (error) {
      return null;
    }
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
