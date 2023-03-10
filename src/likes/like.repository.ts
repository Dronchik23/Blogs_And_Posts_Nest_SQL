import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LikeDbType } from '../types and models/types';
import { DeleteResult } from 'mongodb';
import { LikeDocument } from '../types and models/schemas';

@Injectable()
export class LikesRepository {
  constructor(
    @InjectModel('Like') private readonly likeModel: Model<LikeDocument>,
  ) {}

  async updateLikeStatus(newLike: LikeDbType): Promise<LikeDbType> {
    const filter = { userId: newLike.userId, parentId: newLike.parentId };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    const result = await this.likeModel
      .findOneAndUpdate(filter, newLike, options)
      .lean()
      .exec();
    return void console.log('result', result);
  }

  async deleteAllLikes(): Promise<DeleteResult> {
    return this.likeModel.deleteMany().exec();
  }
}
