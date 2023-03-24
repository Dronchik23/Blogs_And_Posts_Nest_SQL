import { Injectable, Scope } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';

import { UserViewModel } from '../../types and models/models';
import { UsersRepository } from './users-repository.service';
import { EmailService } from '../../email/email.service';
import * as bcrypt from 'bcrypt';
import {
  AccountDataType,
  EmailConfirmationType,
  PasswordRecoveryType,
  UserDBType,
} from '../../types and models/types';

@Injectable({ scope: Scope.DEFAULT })
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
  ) {}

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

  async _generateHash(password: string, salt: string) {
    return await bcrypt.hash(password, salt);
  }

  async deleteUserByUserId(id: string) {
    return await this.usersRepository.deleteUserByUserId(id);
  }

  async changePassword(password: string, userId: ObjectId) {
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await this._generateHash(password, passwordSalt);
    await this.usersRepository.updatePassword(passwordHash, userId);
    return;
  }
}
