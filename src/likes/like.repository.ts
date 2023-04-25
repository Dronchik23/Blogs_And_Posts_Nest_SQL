import { Injectable, Scope } from '@nestjs/common';
import { LikeStatus, LikeSQLDBType } from '../types and models/types';
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
  ): Promise<LikeSQLDBType> {
    const newLike = await this.dataSource.query(
      `UPDATE likes SET status = ${likeStatus}, addedAt = ${addedAt} WHERE userId = ${userId}, parentId = ${parentId}, login = ${login};`,
    );
    return newLike;
  }

  async deleteAllLikes() {
    return await this.dataSource.query(`DELETE FROM likes;`);
  }
}
