import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import {
  BanUserInputModel,
  BloggerBanUserInputModel,
  UserInputModel,
  UserViewModel,
} from '../../types and models/models';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';
import { Users } from '../../entities/users.entity';

@Injectable({ scope: Scope.DEFAULT })
export class UsersRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Users) protected readonly userModel: Repository<Users>,
    protected usersQueryRepository: UsersQueryRepository,
  ) {}

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
    return await this.dataSource.query(`DELETE FROM public.users CASCADE;`);
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
    banUserDTO: BanUserInputModel,
    banDate: string,
  ): Promise<boolean> {
    if (banUserDTO.isBanned === false) {
      banUserDTO.banReason = null;
      banDate = null;
    } // if user unbanned - clear banReason and banDate

    const result = await this.userModel.update(userId, {
      isBanned: banUserDTO.isBanned,
      banReason: banUserDTO.banReason,
      banDate: banDate,
    });

    return result.affected > 0;
  }

  async changeBanStatusForUserByBlogger(
    userId: string,
    bloggerBanUserDTO: BloggerBanUserInputModel,
    banDate: string,
  ): Promise<boolean> {
    if (bloggerBanUserDTO.isBanned === false) {
      bloggerBanUserDTO.banReason = null;
      banDate = null;
      bloggerBanUserDTO.blogId = null;
    } // if user unbanned - clear banReason and banDate

    const user: UserViewModel =
      await this.usersQueryRepository.findUserByUserId(userId);
    if (!user) {
      throw new NotFoundException();
    }

    await this.userModel.update(userId, {
      isBanned: bloggerBanUserDTO.isBanned,
      banReason: bloggerBanUserDTO.banReason,
      blogId: bloggerBanUserDTO.blogId,
      banDate: user.banInfo.banDate,
    });

    return true;
  }

  async createUserBySA(
    createUserDTO: UserInputModel,
    passwordHash: string,
  ): Promise<UserViewModel> {
    const newUser = Users.createBySa(createUserDTO, passwordHash);
    const createdUser = await this.userModel.save(newUser);
    return new UserViewModel(createdUser);
  }

  async createUser(
    createUserDTO: UserInputModel,
    passwordHash: string,
    confirmationCode: string,
  ): Promise<UserViewModel> {
    const newUser = Users.create(createUserDTO, passwordHash, confirmationCode);
    const createdUser = await this.userModel.save(newUser);
    return new UserViewModel(createdUser);
  }
}
