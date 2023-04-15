import { UserDBType } from '../types and models/types';
import { EmailAdapter } from './email.adapter';
import { Injectable, Scope } from '@nestjs/common';
import { MokEmailAdapter } from './mok.email.adapter';
import { messages } from 'nodemailer-mock/dist/lib/messages';

@Injectable({ scope: Scope.DEFAULT })
export class MokEmailService {
  constructor(private readonly mokEmailAdapter: MokEmailAdapter) {}

  async sendEmailRegistrationMessage(user: UserDBType) {
    const code = user.emailConfirmation.confirmationCode;
    await this.mokEmailAdapter.sendEmail(
      user.accountData.email,
      'subject',
      'message',
    );
  }
  async resendingEmailMessage(email: string, code: string) {
    await this.mokEmailAdapter.sendEmail(
      email,
      'Its yours new confirmation code',
      'message',
    );
  }
  async recoveryCodeMessage(email: string, code: string) {
    await this.mokEmailAdapter.sendEmail(
      email,
      'Its yours new confirmation code',
      ` message`,
    );
  }
}
