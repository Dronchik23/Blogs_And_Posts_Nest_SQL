import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import {
  BanUserInputModel,
  BloggerBanUserInputModel,
  UserInputModel,
  UserViewModel,
} from '../../models/models';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';
import { Users } from '../../entities/users.entity';
import { GameStatuses, UserDBType } from '../../types/types';

@Injectable({ scope: Scope.DEFAULT })
export class UsersRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Users) protected readonly userModel: Repository<Users>,
    protected usersQueryRepository: UsersQueryRepository,
  ) {}

  async updateConfirmation(userId: string) {
    const result = await this.userModel.update(userId, {
      isEmailConfirmed: true,
    });

    return result.affected > 0;
  }

  async deleteUserByUserId(userId: string) {
    const result = await this.userModel.delete({ id: userId });
    return result.affected > 0;
  }

  async deleteAllUsers() {
    return await this.userModel.delete({});
  }

  async updateConfirmationCodeByUserId(
    userId: string,
    newConfirmationCode: string,
  ) {
    const result = await this.userModel.update(
      { id: userId },
      { confirmationCode: newConfirmationCode },
    );
    return result.affected > 0;
  }

  async updatePasswordRecoveryCodeByEmail(
    email: string,
    newConfirmationCode: string,
  ) {
    const result = await this.userModel.update(
      { email },
      {
        confirmationCode: newConfirmationCode,
      },
    );

    return result.affected > 0;
  }

  async updatePassword(newPasswordHash: string, userId: string) {
    const result = await this.userModel.update(
      { id: userId },
      { passwordHash: newPasswordHash },
    );
    return result.affected > 0;
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

    const user: UserDBType =
      await this.usersQueryRepository.findUserByUserIdWithDBType(userId);
    if (!user) {
      throw new NotFoundException();
    }

    const result = await this.userModel.update(userId, {
      isBanned: bloggerBanUserDTO.isBanned,
      banReason: bloggerBanUserDTO.banReason,
      blogId: bloggerBanUserDTO.blogId,
      banDate: banDate,
    });

    return result.affected > 0;
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
