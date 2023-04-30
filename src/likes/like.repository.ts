import { Injectable, Scope } from '@nestjs/common';
import { LikeStatus, LikeDBType } from '../types and models/types';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable({ scope: Scope.DEFAULT })
export class LikesRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {
    return;
  }

  async updateLikeStatus(
    parentId: string,
    userId: string,
    login: string,
    likeStatus: LikeStatus,
    addedAt: string,
  ): Promise<LikeDBType> {
    debugger;
    const existingLike = await this.dataSource.query(
      `SELECT * FROM likes WHERE "parentId" = $1 AND "userId" = $2`,
      [parentId, userId],
    );

    if (existingLike.length) {
      const result = await this.dataSource.query(
        `UPDATE likes SET status = $1, "addedAt" = $2, "login" = $3 WHERE "parentId" = $4 AND "userId" = $5`,
        [likeStatus, addedAt, login, parentId, userId],
      );
      console.log('like updated', result[0]);
      return result[0];
    } else {
      const result = await this.dataSource.query(
        `INSERT INTO likes ("parentId", "userId", "login", "status", "addedAt") VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [parentId, userId, login, likeStatus, addedAt],
      );
      console.log('like created', result[0]);
      return result[0];
    }
  }

  async deleteAllLikes() {
    return await this.dataSource.query(`DELETE FROM likes;`);
  }
}
