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
    const newLike = await this.dataSource.query(
      `UPDATE likes SET status = $1, addedAt = $2 WHERE "userId" = $3, "parentId" = $4, login = $5;`,
      [likeStatus, addedAt, userId, parentId, login],
    );
    return newLike;
  }

  async deleteAllLikes() {
    return await this.dataSource.query(`DELETE FROM likes;`);
  }
}
