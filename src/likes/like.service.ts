import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { LikeDbType, LikeStatus } from '../types and models/types';
import { LikesRepository } from './like.repository';

@Injectable()
export class LikesService {
  constructor(private readonly likesRepository: LikesRepository) {}

  async updateLikeStatus(
    parentId: ObjectId,
    userId: ObjectId,
    userLogin: string,
    newLikeStatus: LikeStatus,
  ) {
    const newLike = new LikeDbType(
      parentId,
      userId,
      userLogin,
      newLikeStatus,
      new Date().toISOString(),
    );
    return await this.likesRepository.updateLikeStatus(newLike);
  }
}
