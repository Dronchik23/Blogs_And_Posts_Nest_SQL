import { Injectable } from '@nestjs/common';
import { LikeDbType, LikeStatus } from '../types and models/types';
import { LikesRepository } from './like.repository';
import mongoose from 'mongoose';

@Injectable()
export class LikesService {
  constructor(private readonly likesRepository: LikesRepository) {}

  async updateLikeStatus(
    parentId: string,
    userId: string,
    userLogin: string,
    newLikeStatus: LikeStatus,
  ): Promise<any> {
    const newLike = new LikeDbType(
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
