import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { PaginationType, SortDirection, UserDBType } from '../types/types';
import { UserViewModel } from '../models/models';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Users } from '../entities/users.entity';

@Injectable({ scope: Scope.DEFAULT })
export class UsersQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Users) private readonly userModel: Repository<Users>,
  ) {}

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

  private toUserDBType(user: any) {
    return new UserDBType(
      user.id,
      user.login,
      user.email,
      user.passwordHash,
      user.createdAt,
      user.confirmationCode,
      user.confirmationExpirationDate,
      user.isEmailConfirmed,
      user.recoveryCode,
      user.isRecoveryConfirmed,
      user.isBanned,
      user.banDate,
      user.banReason,
    );
  }

  async getAllUsers(
    searchLoginTerm: string,
    searchEmailTerm: string,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
    banStatus: string | boolean,
  ): Promise<PaginationType> {
    const builder = await this.dataSource
      .createQueryBuilder()
      .select('*')
      .from(Users, 'users');

    if (searchLoginTerm) {
      builder.andWhere('users.login ILIKE :searchLoginTerm', {
        searchLoginTerm: `%${searchLoginTerm}%`,
      });
    }
    if (searchEmailTerm) {
      builder.andWhere('users.email ILIKE :searchEmailTerm', {
        searchEmailTerm: `%${searchEmailTerm}%`,
      });
    }
    if (banStatus === true) {
      builder.andWhere('users."isBanned" = true');
    }
    if (banStatus === 'false') {
      builder.andWhere('users."isBanned" = false');
    }

    const users: UserDBType[] = await builder
      .orderBy(`users.${sortBy}`, sortDirection.toUpperCase() as SortDirection)
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .execute();

    const totalCount: number = await builder.getCount();

    const mappedUsers = this.fromUserDBTypeToUserViewModelWithPagination(users);

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
      const result = await this.userModel.findOneBy({
        id: userId,
      });
      if (!result) {
        throw new NotFoundException();
      }
      const user = new UserViewModel(result);

      return user;
    } catch (e) {
      throw new NotFoundException();
    }
  }

  async findUserByLoginOrEmail(
    loginOrEmail: string,
  ): Promise<UserDBType | null> {
    const result: UserDBType = await this.userModel.findOne({
      where: [{ login: loginOrEmail }, { email: loginOrEmail }],
    });
    if (result) {
      const user: UserDBType = this.toUserDBType(result);

      return user;
    }
  }

  async findUserByEmail(email: string): Promise<UserDBType> {
    const user = await this.userModel.findOneBy({ email: email });
    if (user) {
      return this.toUserDBType(user);
    }
  }

  async findUserByLogin(login: string): Promise<UserDBType | null> {
    const user = await this.userModel.findOneBy({ login: login });
    if (user) {
      return this.toUserDBType(user);
    }
  }

  async findUserByPasswordRecoveryCode(recoveryCode: string) {
    const user = await this.userModel.findOneBy({ recoveryCode: recoveryCode });
    if (user) {
      return this.toUserDBType(user);
    }
  }

  async findUserByConfirmationCode(confirmationCode: string): Promise<any> {
    const user = await this.userModel.findOneBy({
      confirmationCode: confirmationCode,
    });
    if (user) {
      return this.toUserDBType(user);
    }
  }

  async findBannedUsersByBlogId(
    blogId: string,
    pageNumber: number,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    searchLoginTerm: string,
  ) {
    const builder = await this.userModel.createQueryBuilder('users');

    if (searchLoginTerm) {
      builder.andWhere('users.login ILIKE :searchLoginTerm', {
        searchLoginTerm: `%${searchLoginTerm}%`,
      });
    }

    const users: UserDBType[] = await builder
      .andWhere('"blogId" = :blogId', { blogId })
      .andWhere('"isBanned" = true')
      .orderBy(`users.${sortBy}`, sortDirection.toUpperCase() as SortDirection)
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const mappedUsers =
      this.fromUserDBTypeToUserViewModelWithPaginationForBlogger(users);

    const totalCount: number = await builder.getCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedUsers,
    };
  }

  async findUserByUserIdWithDBType(userId: string): Promise<UserDBType> {
    const user = await this.userModel.findOneBy({
      id: userId,
    });
    if (user) {
      return this.toUserDBType(user);
    }
  }

  async findUserByUserIdWithDBTypeBonus(userId: string): Promise<UserDBType> {
    const user = await this.userModel.findOneBy({
      id: userId,
    });
    if (user) {
      return this.toUserDBType(user);
    }
  }
}
