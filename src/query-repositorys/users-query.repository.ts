import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import {
  BanStatus,
  PaginationType,
  UserDBType,
  UserSQLDBType,
} from '../types and models/types';
import { UserViewModel } from '../types and models/models';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable({ scope: Scope.DEFAULT })
export class UsersQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {
    return;
  }

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

  private fromUserDBTypeToUserViewModelWithPagination(users: UserSQLDBType[]) {
    return users.map((user) => ({
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
      banInfo: {
        isBanned: user.isBanned,
        banDate: user.banDate,
        banReason: user.banReason,
      },
    }));
  }
  private fromUserDBTypeToUserViewModelWithPaginationForBlogger(
    users: UserSQLDBType[],
  ) {
    return users.map((user) => ({
      id: user.id,
      login: user.login,
      banInfo: {
        isBanned: user.isBanned,
        banDate: user.banDate,
        banReason: user.banReason,
      },
    }));
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
    const users: UserSQLDBType[] = await this.dataSource.query(`
  SELECT *
FROM blogs
WHERE name ILIKE '%${searchLoginTerm ?? ''}%'
  AND email ILIKE '%${searchEmailTerm ?? ''}%'
  AND isBanned = '${banStatus}'
ORDER BY ${sortBy} ${sortDirection}
LIMIT ${pageSize}
OFFSET ${(pageNumber - 1) * pageSize};
  `);

    const mappedUsers = this.fromUserDBTypeToUserViewModelWithPagination(users);

    const totalCount = users.length;

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount, // exclude 0
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedUsers,
    };
  }

  async findUserByUserId(userId: string): Promise<UserViewModel | null> {
    try {
      const user = await this.dataSource.query(
        `SELECT * FROM users WHERE id = '${userId}';`,
      );
      return this.fromUserDBTypeToUserViewModel(user);
    } catch (e) {
      throw new NotFoundException();
    }
  }

  async findUserByLoginOrEmail(
    loginOrEmail: string,
  ): Promise<UserSQLDBType | null> {
    return await this.dataSource.query(
      `SELECT * FROM users WHERE login = '${loginOrEmail}' OR email = '${loginOrEmail}';`,
    );
  }

  async findUserByEmail(email: string): Promise<any> {
    return await this.dataSource.query(
      `SELECT * FROM users WHERE email = '${email}';`,
    );
  }

  async findUserByLogin(login: string): Promise<any> {
    return await this.dataSource.query(
      `SELECT * FROM users WHERE login = '${login}';`,
    );
  }

  async findUserByPasswordRecoveryCode(recoveryCode: string) {
    return await this.dataSource.query(
      `SELECT * FROM users WHERE recoveryCode = '${recoveryCode}';`,
    );
  }

  async findUserByConfirmationCode(confirmationCode: string): Promise<any> {
    return await this.dataSource.query(
      `SELECT * FROM users WHERE confirmationCode = '${confirmationCode}';`,
    );
  }

  async findBannedUsers(): Promise<UserSQLDBType[]> {
    return await this.dataSource.query(
      `SELECT * FROM users WHERE isBanned = true;`,
    );
  }

  async findBannedUsersByBlogId(
    blogId: string,
    pageNumber: number,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    searchLoginTerm: string,
  ) {
    const users: UserSQLDBType[] = await this.dataSource.query(`
  SELECT * FROM blogs
  WHERE name ILIKE '%${searchLoginTerm ?? ''}%', blogId = ${blogId}
  ORDER BY ${sortBy} ${sortDirection}
  LIMIT ${pageSize}
  OFFSET ${(pageNumber - 1) * pageSize};
`);

    const mappedUsers =
      this.fromUserDBTypeToUserViewModelWithPaginationForBlogger(users);

    const totalCount = users.length;

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount, // exclude 0
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedUsers,
    };
  }

  async findUserByUserIdWithDBType(userId: string) {
    return await this.dataSource.query(
      `SELECT * FROM users WHERE id = '${userId}';`,
    );
  }
}
