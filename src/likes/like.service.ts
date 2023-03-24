import { Injectable, Scope } from '@nestjs/common';
import { LikeDBType, LikeStatus } from '../types and models/types';
import { LikesRepository } from './like.repository';
import mongoose from 'mongoose';

@Injectable({ scope: Scope.DEFAULT })
export class LikesService {
  constructor(private readonly likesRepository: LikesRepository) {}

  async updateLikeStatus(
    parentId: string,
    userId: string,
    userLogin: string,
    newLikeStatus: LikeStatus,
  ): Promise<any> {
    const newLike = new LikeDBType(
      new mongoose.Types.ObjectId(parentId),
      new mongoose.Types.ObjectId(userId),
      userLogin,
      newLikeStatus,
      new Date().toISOString(),
    );
    console.log(newLike, 'like service');
    const isUpdated = await this.likesRepository.updateLikeStatus(newLike);
    if (!isUpdated) {
      return false;
    }
  }
}
