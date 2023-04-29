import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { PaginationType, UserDBType } from '../types and models/types';
import { UserViewModel } from '../types and models/models';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable({ scope: Scope.DEFAULT })
export class UsersQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {
    return;
  }

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

  private fromUserDBTypeToUserViewModelWithPagination(users: UserDBType[]) {
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
    users: UserDBType[],
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
    banStatus: string,
  ): Promise<PaginationType> {
    const users: UserDBType[] = await this.dataSource.query(
      `
  SELECT *
  FROM users
  WHERE login ILIKE $1
    OR email ILIKE $2
    AND "isBanned" = $3
  ORDER BY "${sortBy}" ${sortDirection}
  LIMIT $4
  OFFSET $5;
`,
      [
        `%${searchLoginTerm ?? ''}%`,
        `%${searchEmailTerm ?? ''}%`,
        banStatus,
        pageSize,
        (pageNumber - 1) * pageSize,
      ],
    );

    const mappedUsers = this.fromUserDBTypeToUserViewModelWithPagination(users);

    const usersRawCount: number = await this.dataSource.query(
      `
        SELECT COUNT(*)
        FROM users
        WHERE login ILIKE $1
        OR email ILIKE $2
        AND "isBanned" = $3
`,
      [`%${searchLoginTerm ?? ''}%`, `%${searchEmailTerm ?? ''}%`, banStatus],
    );

    const usersCount = +usersRawCount[0].count;
    const pagesCount = Math.ceil(usersCount / pageSize);

    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount, // exclude 0
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: usersCount,
      items: mappedUsers,
    };
  }

  async findUserByUserId(userId: string): Promise<UserViewModel | null> {
    try {
      const user = await this.dataSource.query(
        `SELECT * FROM users WHERE id = $1;`,
        [userId],
      );
      return this.fromUserDBTypeToUserViewModel(user[0]);
    } catch (e) {
      throw new NotFoundException();
    }
  }

  async findUserByLoginOrEmail(
    loginOrEmail: string,
  ): Promise<UserDBType | null> {
    const user = await this.dataSource.query(
      `SELECT * FROM users WHERE login = $1 OR email = $1`,
      [loginOrEmail],
    );
    return user[0];
  }

  async findUserByEmail(email: string): Promise<UserDBType | null> {
    const result = await this.dataSource.query(
      `SELECT * FROM users WHERE email = $1;`,
      [email],
    );
    return result.length ? result[0] : null;
  }

  async findUserByLogin(login: string): Promise<UserDBType | null> {
    const result = await this.dataSource.query(
      'SELECT * FROM users WHERE login = $1',
      [login],
    );
    return result.length ? result[0] : null;
  }

  async findUserByPasswordRecoveryCode(recoveryCode: string) {
    return await this.dataSource.query(
      `SELECT * FROM users WHERE "recoveryCode" = $1`,
      [recoveryCode],
    );
  }

  async findUserByConfirmationCode(confirmationCode: string): Promise<any> {
    const user = await this.dataSource.query(
      `SELECT * FROM users WHERE "confirmationCode" = $1`,
      [confirmationCode],
    );
    return user[0];
  }

  async findBannedUsers(): Promise<UserDBType[]> {
    return await this.dataSource.query(
      `SELECT * FROM users WHERE "isBanned" = true;`,
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
    const users: UserDBType[] = await this.dataSource.query(
      `
      SELECT *
  FROM blogs
  WHERE login ILIKE $1
    AND "blogId" = $2
  ORDER BY "${sortBy}" ${sortDirection}
  LIMIT $3
  OFFSET $4;`,
      [searchLoginTerm, blogId, pageSize, (pageNumber - 1) * pageSize],
    );

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
    return await this.dataSource.query(`SELECT * FROM users WHERE id = $1`, [
      userId,
    ]);
  }
}
