import { Injectable, Scope } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable({ scope: Scope.DEFAULT })
export class TokensRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async addToRefreshTokenBlackList(refreshToken: string) {
    return await this.dataSource.query(
      `
INSERT INTO "refreshTokenBlackList" (
  "refreshToken"
) 
VALUES ($1) 
RETURNING *
  `,
      [refreshToken],
    );
  }

  async findBannedToken(refreshToken: string) {
    const result = await this.dataSource.query(
      `SELECT * FROM "refreshTokenBlackList" WHERE "refreshToken" = $1`,
      [refreshToken],
    );
    return result[0];
  }

  async deleteAllBannedRefreshTokens() {
    return await this.dataSource.query(
      `DELETE FROM "refreshTokenBlackList" CASCADE;`,
    );
  }
}
