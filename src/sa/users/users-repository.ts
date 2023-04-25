import { Injectable, Scope } from '@nestjs/common';
import {
  AccountDataType,
  EmailConfirmationType,
  PasswordRecoveryType,
  UserSQLDBType,
} from '../../types and models/types';
import { UserViewModel } from '../../types and models/models';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable({ scope: Scope.DEFAULT })
export class UsersRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  private fromUserDBTypeToUserViewModel(user: UserSQLDBType): UserViewModel {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
      banInfo: {
        isBanned: user.isBanned,
        banDate: user.banDate,
        banReason: user.banReason,
      },
    };
  }

  async updateConfirmation(userId: any) {
    const result = await this.dataSource.query(
      `UPDATE users SET isEmailConfirmed = true WHERE id = ${userId};`,
    );
    return result.affectedRows > 0;
  }

  async deleteUserByUserId(userId: string) {
    return await this.dataSource.query(
      `DELETE FROM users WHERE id = ${userId};`,
    );
  }

  async deleteAllUsers() {
    return await this.dataSource.query(`DELETE FROM users;`);
  }

  async updateConfirmationCodeByUserId(
    userId: any,
    newConfirmationCode: string,
  ) {
    const result = await this.dataSource.query(
      `UPDATE users SET confirmationCode = ${newConfirmationCode} WHERE id = ${userId};`,
    );
    return result.affectedRows > 0;
  }

  async updatePasswordRecoveryCodeByEmail(
    email: string,
    newConfirmationCode: string,
  ) {
    const result = await this.dataSource.query(
      `UPDATE users SET confirmationCode = ${newConfirmationCode} WHERE email = ${email};`,
    );
    return result.affectedRows > 0;
  }

  async updatePassword(passwordHash: string, userId: string) {
    const result = await this.dataSource.query(
      `UPDATE users SET passwordHash = ${passwordHash} WHERE id = ${userId};`,
    );
    return result.affectedRows > 0;
  }

  async changeBanStatusForUserBySA(
    userId: string,
    isBanned: boolean,
    banReason: string,
    banDate: string,
  ) {
    if (isBanned === false) {
      banReason = null;
      banDate = null;
    } // if user unbanned - clear banReason and banDate
    const result = await this.dataSource.query(
      `UPDATE users SET isBanned = ${isBanned}, banReason = ${banReason}, banDate = ${banDate} WHERE id = ${userId};`,
    );
    return result.affectedRows > 0;
  }

  async changeBanStatusForUserByBlogger(
    userId: string,
    isBanned: boolean,
    banReason: string,
    banDate: string,
    blogId: string,
  ) {
    if (!isBanned) {
      banReason = null;
      banDate = null;
      blogId = null;
    } // if user unbanned - clear banReason and banDate
    const result = await this.dataSource.query(
      `UPDATE users SET isBanned = ${isBanned}, banReason = ${banReason}, banDate = ${banDate}, blogId = ${blogId}  WHERE id = ${userId};`,
    );
    return result.affectedRows > 0;
  }

  async createUser(
    accountData: AccountDataType,
    emailConfirmation: EmailConfirmationType,
    passwordRecovery: PasswordRecoveryType,
  ) {
    const query = `
   INSERT INTO public.users(
  login,
  email,
  "passwordHash",
  "createdAt",
  "confirmationCode",
  "confirmationExpirationDate",
  "isEmailConfirmed",
  "recoveryCode",
  "isRecoveryConfirmed"
) 
VALUES (
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,
  $8,
  $9
) 
RETURNING *
  `;
    const values = [
      accountData.login,
      accountData.email,
      accountData.passwordHash,
      accountData.createdAt,
      emailConfirmation.confirmationCode,
      emailConfirmation.expirationDate,
      emailConfirmation.isConfirmed,
      passwordRecovery.recoveryCode,
      passwordRecovery.isConfirmed,
    ];

    const user = await this.dataSource.query(query, values);

    return this.fromUserDBTypeToUserViewModel(user[0]); // mapping user
  }
}
