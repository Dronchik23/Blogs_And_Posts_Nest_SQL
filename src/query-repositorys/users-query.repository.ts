import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { FilterQuery, Model } from 'mongoose';
import {
  BanStatus,
  PaginationType,
  UserDBType,
} from '../types and models/types';
import { UserViewModel } from '../types and models/models';
import { UserDocument } from '../types and models/schemas';
import { ObjectId } from 'mongodb';

@Injectable({ scope: Scope.DEFAULT })
export class UsersQueryRepository {
  constructor(@InjectModel('User') public usersModel: Model<UserDocument>) {}

  private fromUserDBTypeToUserViewModel(user: UserDBType): UserViewModel {
    return {
      id: user._id.toString(),
      login: user.accountData.login,
      email: user.accountData.email,
      createdAt: user.accountData.createdAt,
      banInfo: {
        isBanned: user.banInfo.isBanned,
        banDate: user.banInfo.banDate,
        banReason: user.banInfo.banReason,
      },
    };
  }

  private fromUserDBTypeToUserViewModelWithPagination(users: UserDBType[]) {
    return users.map((user) => ({
      id: user._id.toString(),
      login: user.accountData.login,
      email: user.accountData.email,
      createdAt: user.accountData.createdAt,
      banInfo: {
        isBanned: user.banInfo.isBanned,
        banDate: user.banInfo.banDate,
        banReason: user.banInfo.banReason,
      },
    }));
  }
  private fromUserDBTypeToUserViewModelWithPaginationForBlogger(
    users: UserDBType[],
  ) {
    return users.map((user) => ({
      id: user._id.toString(),
      login: user.accountData.login,
      banInfo: {
        isBanned: user.banInfo.isBanned,
        banDate: user.banInfo.banDate,
        banReason: user.banInfo.banReason,
      },
    }));
  }

  private searchLoginAndEmailTermFilter(
    searchLoginTerm?: string,
    searchEmailTerm?: string,
    banStatus?: BanStatus,
  ): FilterQuery<UserDBType> {
    const filter: FilterQuery<UserDBType> = {
      $or: [
        {
          'accountData.email': {
            $regex: searchEmailTerm || '',
            $options: 'i',
          },
        },
        {
          'accountData.login': {
            $regex: searchLoginTerm || '',
            $options: 'i',
          },
        },
      ],
    };

    if (banStatus === BanStatus.banned) {
      filter['banInfo.isBanned'] = true;
    } else if (banStatus === BanStatus.notBanned) {
      filter['banInfo.isBanned'] = false;
    }

    return filter;
  }

  async getAllUsers(
    searchLoginTerm: string,
    searchEmailTerm: string,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
    banStatus: BanStatus,
  ): Promise<PaginationType> {
    const filter = this.searchLoginAndEmailTermFilter(
      searchLoginTerm,
      searchEmailTerm,
      banStatus,
    );

    const users: UserDBType[] = await this.usersModel
      .find(filter)
      .sort({ [`accountData.${sortBy}`]: sortDirection === 'asc' ? 1 : -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const mappedUsers = this.fromUserDBTypeToUserViewModelWithPagination(users);

    const totalCount = await this.usersModel.countDocuments(filter);

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount, // exclude 0
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedUsers,
    };
  }

  async findUserByUserId(id: string): Promise<UserViewModel | null> {
    try {
      const user = await this.usersModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
      });
      return this.fromUserDBTypeToUserViewModel(user);
    } catch (e) {
      throw new NotFoundException();
    }
  }

  async findUserByLoginOrEmail(
    loginOrEmail: string,
  ): Promise<UserDBType | null> {
    return this.usersModel
      .findOne({
        $or: [
          { 'accountData.email': loginOrEmail },
          { 'accountData.login': loginOrEmail },
        ],
      })
      .exec();
  }

  async findUserByEmail(email: string): Promise<any> {
    return this.usersModel.findOne({
      'accountData.email': email,
    });
  }

  async findUserByLogin(login: string): Promise<any> {
    return this.usersModel.findOne({
      'accountData.login': login,
    });
  }

  async findUserByPasswordRecoveryCode(code: string) {
    return this.usersModel.findOne({ 'passwordRecovery.recoveryCode': code });
  }

  async findUserByConfirmationCode(code: string): Promise<any> {
    return this.usersModel.findOne({
      'emailConfirmation.confirmationCode': code,
    });
  }

  async findBannedUsers(): Promise<UserDBType[]> {
    return this.usersModel.find({ 'banInfo.isBanned': true }).lean();
  }

  async findBannedUsersByBlogId(
    blogId: string,
    pageNumber: number,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    searchLoginTerm: string,
  ) {
    const filter = {
      ...this.searchLoginAndEmailTermFilter(searchLoginTerm),
      'banInfo.blogId': blogId,
    };

    const users: UserDBType[] = await this.usersModel
      .find(filter)
      .sort({ [`accountData.${sortBy}`]: sortDirection === 'asc' ? 1 : -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const mappedUsers =
      this.fromUserDBTypeToUserViewModelWithPaginationForBlogger(users);

    const totalCount = await this.usersModel.countDocuments(filter);

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount, // exclude 0
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedUsers,
    };
  }

  async findUserWithDBType(userId: string) {
    return this.usersModel.findOne({ _id: new ObjectId(userId) }).lean();
  }
}
