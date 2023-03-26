import { Injectable, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { FilterQuery, Model } from 'mongoose';
import {
  PaginationType,
  searchLoginOrEmailTermType,
  UserDBType,
} from '../types and models/types';
import { UserViewModel } from '../types and models/models';
import { UserDocument } from '../types and models/schemas';

@Injectable({ scope: Scope.DEFAULT })
export class UsersQueryRepository {
  constructor(@InjectModel('User') public usersModel: Model<UserDocument>) {}

  private fromUserDBTypeToUserViewModel(user: UserDBType): UserViewModel {
    return {
      id: user._id.toString(),
      login: user.accountData.login,
      email: user.accountData.email,
      createdAt: user.accountData.createdAt,
      banInfo: user.banInfo,
    };
  }

  private fromUserDBTypeToUserViewModelWithPagination(users: UserDBType[]) {
    return users.map((user) => ({
      id: user._id.toString(),
      login: user.accountData.login,
      email: user.accountData.email,
      createdAt: user.accountData.createdAt,
      banInfo: user.banInfo,
    }));
  }

  private searchLoginAndEmailTermFilter(
    searchLoginTerm: string,
    searchEmailTerm: string,
  ): FilterQuery<UserDBType> {
    return {
      $or: [
        {
          'accountData.email': {
            $regex: searchEmailTerm ?? '',
            $options: 'i',
          },
        },
        {
          'accountData.login': {
            $regex: searchLoginTerm ?? '',
            $options: 'i',
          },
        },
      ],
    };
  }

  async getAllUsers(
    searchLoginTerm: string,
    searchEmailTerm: string,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
  ): Promise<PaginationType> {
    const filter = this.searchLoginAndEmailTermFilter(
      searchLoginTerm,
      searchEmailTerm,
    );

    const users = await this.usersModel
      .find(filter)
      .sort({ [`accountData.${sortBy}`]: sortDirection === 'asc' ? 1 : -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const mappedUsers = this.fromUserDBTypeToUserViewModelWithPagination(users);

    const totalCount = await this.getUsersCount(
      searchLoginTerm,
      searchEmailTerm,
    );

    return {
      pagesCount: Math.ceil(totalCount / +pageSize),
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedUsers,
    };
  }

  async findUserByUserId(id: string): Promise<UserViewModel | null> {
    const user = await this.usersModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
    });
    if (user) {
      return this.fromUserDBTypeToUserViewModel(user);
    } else {
      return null;
    }
  }

  async findUserByLoginOrEmail(
    loginOrEmail: string,
  ): Promise<UserDBType | null> {
    return this.usersModel.findOne({
      $or: [
        { 'accountData.email': loginOrEmail },
        { 'accountData.login': loginOrEmail },
      ],
    });
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

  async getUsersCount(
    searchLoginTerm: searchLoginOrEmailTermType,
    searchEmailTerm: searchLoginOrEmailTermType,
  ) {
    const filter = this.searchLoginAndEmailTermFilter(
      searchLoginTerm,
      searchEmailTerm,
    );
    return this.usersModel.countDocuments(filter);
  }
}
