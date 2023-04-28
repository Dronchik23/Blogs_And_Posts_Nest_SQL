import { Injectable, Scope } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable({ scope: Scope.DEFAULT })
export class TokensRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {
    return;
  }

  async addRefreshToBlackList(refreshToken: string) {
    const query = `
   INSERT INTO public.users(
  "refreshToken",
) 
VALUES (
  $1,
) 
RETURNING *
  `;
    const values = [refreshToken];

    return await this.dataSource.query(query, values);
  }

  async findBannedToken(refreshToken: string) {
    return await this.dataSource.query(
      `SELECT * FROM refreshTokenBlackList WHERE refreshToken = '${refreshToken}'`,
    );
  }
}
