import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { UserDBType } from '../types and models/types';
import { UserViewModel } from '../types and models/models';
import { UserDocument } from '../types and models/schemas';

type searchLoginOrEmailTermType = string | undefined;

const fromUserDBTypeToUserViewModel = (user: UserDBType): UserViewModel => {
  return {
    id: user._id.toString(),
    login: user.accountData.login,
    email: user.accountData.email,
    createdAt: user.accountData.createdAt,
  };
};

const fromUserDBTypeToUserViewModelWithPagination = (
  users: UserDBType[],
): UserViewModel[] => {
  return users.map((user) => ({
    id: user._id.toString(),
    login: user.accountData.login,
    email: user.accountData.email,
    createdAt: user.accountData.createdAt,
  }));
};

const searchLoginAndEmailTermFilter = (
  searchLoginTerm: searchLoginOrEmailTermType,
  searchEmailTerm: searchLoginOrEmailTermType,
): FilterQuery<UserDBType> => {
  return {
    $or: [
      {
        'accountData.email': {
          $regex: searchEmailTerm ? searchEmailTerm : '',
          $options: 'i',
        },
      },
      {
        'accountData.userName': {
          $regex: searchLoginTerm ? searchLoginTerm : '',
          $options: 'i',
        },
      },
    ],
  };
};

@Injectable()
export class UsersRepository {
  constructor(@InjectModel('User') public usersModel: Model<UserDocument>) {}

  async getAllUsers(
    searchLoginTerm: string,
    searchEmailTerm: string,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
  ): Promise<UserViewModel[]> {
    const filter = searchLoginAndEmailTermFilter(
      searchLoginTerm,
      searchEmailTerm,
    );

    const sortedUsers = await this.usersModel
      .find(filter)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .lean();

    return fromUserDBTypeToUserViewModelWithPagination(sortedUsers);
  }

  async createUser(userForSave: UserDBType): Promise<UserViewModel> {
    await this.usersModel.create(userForSave);
    return fromUserDBTypeToUserViewModel(userForSave);
  }

  async findUserByUserId(id: string): Promise<UserViewModel | null> {
    const user = await this.usersModel.findOne({ _id: new ObjectId(id) });
    if (user) {
      return fromUserDBTypeToUserViewModel(user);
    } else {
      return null;
    }
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<UserDBType | null> {
    return this.usersModel.findOne({
      $or: [
        { 'accountData.email': loginOrEmail },
        { 'accountData.login': loginOrEmail },
      ],
    });
  }

  async findByEmail(email: string) {
    return this.usersModel.findOne({ 'accountData.email': email });
  }

  async findUserByPasswordRecoveryCode(code: string) {
    return this.usersModel.findOne({ 'passwordRecovery.recoveryCode': code });
  }

  async findUserByConfirmationCode(code: string) {
    return this.usersModel.findOne({
      'emailConfirmation.confirmationCode': code,
    });
  }

  async updateConfirmation(userId: ObjectId) {
    const result = await this.usersModel.updateOne(
      { id: userId },
      { $set: { 'emailConfirmation.isConfirmed': true } },
    );
    return result.modifiedCount === 1;
  }

  async getUsersCount(
    searchLoginTerm: searchLoginOrEmailTermType,
    searchEmailTerm: searchLoginOrEmailTermType,
  ) {
    const filter = searchLoginAndEmailTermFilter(
      searchLoginTerm,
      searchEmailTerm,
    );
    return this.usersModel.countDocuments(filter, { skip: 1 });
  }

  async deleteUserByUserId(id: string) {
    const result = await this.usersModel.deleteOne({ id: id });
    if (result.deletedCount === 1) {
      return true;
    } else {
      return false;
    }
  }

  async deleteAllUsers(): Promise<any> {
    return this.usersModel.deleteMany({});
  }

  async updateConfirmationCodeByUserId(
    userId: ObjectId,
    newConfirmationCode: string,
  ) {
    const result = await this.usersModel.updateOne(
      { _id: userId },
      { $set: { 'emailConfirmation.confirmationCode': newConfirmationCode } },
    );
    return result.modifiedCount === 1;
  }

  async updatePasswordRecoveryCodeByEmail(
    email: string,
    newConfirmationCode: string,
  ) {
    const result = await this.usersModel.updateOne(
      { 'accountData.email': email },
      {
        $set: {
          'passwordRecovery.recoveryCode': newConfirmationCode,
          'passwordRecovery.isConfirmed': false,
        },
      },
    );
    return result.modifiedCount === 1;
  }

  async updatePassword(passwordHash: string, userId: ObjectId) {
    const result = await this.usersModel.updateOne(
      { _id: userId },
      {
        $set: {
          'accountData.passwordHash': passwordHash,
          'passwordRecovery.recoveryCode': null,
          'passwordRecovery.isConfirmed': true,
        },
      },
    );
    return result.matchedCount === 1;
  }
}
