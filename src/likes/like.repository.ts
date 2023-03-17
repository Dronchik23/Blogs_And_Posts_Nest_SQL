import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LikeDBType } from '../types and models/types';
import { DeleteResult } from 'mongodb';
import { LikeDocument } from '../types and models/schemas';

@Injectable()
export class LikesRepository {
  constructor(
    @InjectModel('Like') private readonly likeModel: Model<LikeDocument>,
  ) {}

  async updateLikeStatus(newLike: any): Promise<LikeDBType> {
    const filter = { userId: newLike.userId, parentId: newLike.parentId };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    await this.likeModel
      .findOneAndUpdate(filter, { ...newLike }, options)
      .lean()
      .exec();
    return newLike;
  }

  async deleteAllLikes(): Promise<DeleteResult> {
    return this.likeModel.deleteMany().exec();
  }
}
