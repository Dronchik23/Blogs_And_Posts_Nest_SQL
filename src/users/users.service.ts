import { Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import {
  AccountDataType,
  EmailConfirmationType,
  PaginationType,
  PasswordRecoveryType,
  UserDBType,
} from 'src/types and models/types';
import { UserViewModel } from '../types and models/models';
import { UsersRepository } from './users.repository';
import { EmailService } from '../email/email.controller';
import { inject } from 'inversify';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @inject(UsersRepository) private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
  ) {}

  async findAllUsers(
    searchLoginTerm: string,
    searchEmailTerm: string,
    pageNumber: number,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
  ): Promise<PaginationType> {
    const allUsers = await this.usersRepository.getAllUsers(
      searchLoginTerm,
      searchEmailTerm,
      pageSize,
      sortBy,
      sortDirection,
      pageNumber,
    );

    const totalCount = await this.usersRepository.getUsersCount(
      searchLoginTerm,
      searchEmailTerm,
    );

    return {
      pagesCount: Math.ceil(totalCount / +pageSize),
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: allUsers,
    };
  }

  async createUser(
    login: string,
    email: string,
    password: string,
  ): Promise<UserViewModel> {
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await this._generateHash(password, passwordSalt);
    const code = uuidv4();
    const createdAt = new Date().toISOString();
    const expirationDate = add(new Date(), { hours: 2, minutes: 3 });
    const user = new UserDBType(
      new ObjectId(),
      new AccountDataType(login, email, passwordHash, createdAt),
      new EmailConfirmationType(code, expirationDate, false),
      new PasswordRecoveryType(null, true),
    );
    const result = await this.usersRepository.createUser(user);

    try {
      await this.emailService.sendEmailRegistrationMessage(user);
    } catch (err) {
      console.error(err);
    }

    return result;
  }

  async getUserByUserId(id: string): Promise<UserViewModel | null> {
    const user = await this.usersRepository.findUserByUserId(id);
    if (user) {
      return user;
    } else {
      return null;
    }
  }

  async _generateHash(password: string, salt: string) {
    return await bcrypt.hash(password, salt);
  }

  async deleteUserByUserId(id: string) {
    return await this.usersRepository.deleteUserByUserId(id);
  }

  async findUserByEmail(email: string) {
    return await this.usersRepository.findByEmail(email);
  }

  async findUserByRecoveryCode(recoveryCode: string) {
    return await this.usersRepository.findUserByPasswordRecoveryCode(
      recoveryCode,
    );
  }

  async changePassword(password: string, userId: ObjectId) {
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await this._generateHash(password, passwordSalt);
    await this.usersRepository.updatePassword(passwordHash, userId);
    return;
  }
}
