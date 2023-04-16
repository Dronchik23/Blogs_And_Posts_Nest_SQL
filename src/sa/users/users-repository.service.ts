import { Injectable, Scope } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { UserDBType } from '../../types and models/types';
import { UserViewModel } from '../../types and models/models';
import { UserDocument } from '../../types and models/schemas';

@Injectable({ scope: Scope.DEFAULT })
export class UsersRepository {
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

  async createUser(userForSave: UserDBType): Promise<UserViewModel> {
    const newUser = await this.usersModel.create(userForSave);
    return this.fromUserDBTypeToUserViewModel(newUser);
  }

  async updateConfirmation(userId: ObjectId) {
    const result = await this.usersModel.updateOne(
      { id: userId },
      { $set: { 'emailConfirmation.isConfirmed': true } },
    );
    return result.modifiedCount === 1;
  }

  async deleteUserByUserId(id: string) {
    debugger;
    try {
      const result = await this.usersModel.deleteOne({
        _id: new mongoose.Types.ObjectId(id),
      });
      return result.deletedCount === 1;
    } catch (e) {
      return false;
    }
  }

  async deleteAllUsers() {
    console.log('delete');
    await this.usersModel.deleteMany({});
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

  async changeBanStatusForUser(
    userId: string,
    isBanned: boolean,
    banReason: string,
    banDate: string,
  ) {
    if (isBanned === false) {
      (banReason = null), (banDate = null);
    } // if user unbanned - clear banReason and banDate
    const result = await this.usersModel.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      {
        $set: {
          'banInfo.isBanned': isBanned,
          'banInfo.banDate': banDate,
          'banInfo.banReason': banReason,
        },
      },
    );
    return result.matchedCount === 1;
  }
}
