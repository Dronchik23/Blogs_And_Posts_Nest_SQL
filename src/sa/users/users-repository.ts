import { Injectable, Scope } from '@nestjs/common';
import { UserDBType } from '../../types and models/types';
import { UserViewModel } from '../../types and models/models';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable({ scope: Scope.DEFAULT })
export class UsersRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  private fromUserDBTypeToUserViewModel(user: UserDBType): UserViewModel {
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

  async updateConfirmation(userId: string) {
    const result = await this.dataSource.query(
      `UPDATE users SET "isEmailConfirmed" = true WHERE id = $1;`,
      [userId],
    );
    return result[1];
  }

  async deleteUserByUserId(userId: string) {
    const result = await this.dataSource.query(
      `DELETE FROM users WHERE id = $1;`,
      [userId],
    );
    return result[1];
  }

  async deleteAllUsers() {
    return await this.dataSource.query(`DELETE FROM users;`);
  }

  async updateConfirmationCodeByUserId(
    userId: string,
    newConfirmationCode: string,
  ) {
    const result = await this.dataSource.query(
      `UPDATE users SET "confirmationCode" = $1 WHERE id = $2`,
      [newConfirmationCode, userId],
    );
    return result.affectedRows > 0;
  }

  async updatePasswordRecoveryCodeByEmail(
    email: string,
    newConfirmationCode: string,
  ) {
    const result = await this.dataSource.query(
      `UPDATE users SET "confirmationCode" = ${newConfirmationCode} WHERE email = ${email};`,
      [newConfirmationCode, email],
    );
    return result.affectedRows > 0;
  }

  async updatePassword(passwordHash: string, userId: string) {
    const result = await this.dataSource.query(
      `UPDATE users SET "passwordHash" = $1 WHERE id = $2;`,
      [passwordHash, userId],
    );
    return result.affectedRows > 0;
  }

  async changeBanStatusForUserBySA(
    userId: string,
    isBanned: boolean,
    banReason: string,
    banDate: string,
  ) {
    debugger;
    if (isBanned === false) {
      banReason = null;
      banDate = null;
    } // if user unbanned - clear banReason and banDate
    const result = await this.dataSource.query(
      `UPDATE users SET "isBanned" = $1, "banReason" = $2, "banDate" = $3 WHERE id = $4;`,
      [isBanned, banReason, banDate, userId],
    );
    console.log('result', result);
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
      `UPDATE users SET "isBanned" = $1, "banReason" = $2, "banDate" = $3, "blogId" = $4  WHERE id = $5;`,
      [isBanned, banReason, banDate, blogId, userId],
    );
    return result.affectedRows > 0;
  }

  async createUser(
    login: string,
    email: string,
    passwordHash: string,
    createdAt: string,
    confirmationCode: string,
    confirmationExpirationDate: string,
    isEmailConfirmed: boolean,
    recoveryCode: string,
    isRecoveryConfirmed: boolean,
    isBanned: boolean,
  ): Promise<UserViewModel> {
    const user = await this.dataSource.query(
      `
    INSERT INTO users (
      login,
      email,
      "passwordHash",
      "createdAt",
      "confirmationCode",
      "confirmationExpirationDate",
      "isEmailConfirmed",
      "recoveryCode",
      "isRecoveryConfirmed",
      "isBanned"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
    `,
      [
        login,
        email,
        passwordHash,
        createdAt,
        confirmationCode,
        confirmationExpirationDate,
        isEmailConfirmed,
        recoveryCode,
        isRecoveryConfirmed,
        isBanned,
      ],
    );
    return this.fromUserDBTypeToUserViewModel(user[0]); // mapping user
  }
}
