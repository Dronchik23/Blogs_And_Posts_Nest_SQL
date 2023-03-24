import { Injectable, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TokenBlackList,
  TokenBlackListDocument,
} from '../types and models/schemas';

@Injectable({ scope: Scope.DEFAULT })
export class TokensRepository {
  constructor(
    @InjectModel(TokenBlackList.name)
    private readonly tokensBlackListModel: Model<TokenBlackListDocument>,
  ) {}

  async addRefreshToBlackList(refreshToken: string) {
    const token = new this.tokensBlackListModel({ refreshToken });
    return token.save();
  }

  async findBannedToken(refreshToken: string) {
    return this.tokensBlackListModel.findOne({ refreshToken });
  }
}
