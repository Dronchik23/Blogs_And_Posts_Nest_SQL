import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.DEFAULT })
export class TokensRepository {
  constructor() {
    return;
  }

  async addRefreshToBlackList(refreshToken: string) {
    return;
  }

  async findBannedToken(refreshToken: string) {
    return;
  }
}
