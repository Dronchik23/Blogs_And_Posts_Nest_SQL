import { UserDBType } from '../types and models/types';
import { EmailAdapter } from './email.adapter';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.DEFAULT })
export class EmailService {
  constructor(private readonly emailAdapter: EmailAdapter) {}

  async sendEmail(email: any, subject: string, message: string) {
    await this.emailAdapter.sendEmail(email, subject, message);
  }
  async sendEmailRegistrationMessage(user: UserDBType) {
    console.log('user', user);
    const code = user.emailConfirmation.confirmationCode;
    await this.emailAdapter.sendEmail(
      user.accountData.email,
      'Confirm your email',
      `<a href='https://blogs-and-posts-ver2-dgfu.vercel.app/auth/registration-confirmation?code=${code}'>complete registration</a>`,
    );
  }
  async resendingEmailMessage(email: string, code: string) {
    await this.emailAdapter.sendEmail(
      email,
      'Its yours new confirmation code',
      `<a href='https://blogs-and-posts-ver2-dgfu.vercel.app/auth/registration-email-resending?code=${code}'>new confirmation code</a>`,
    );
  }
  async recoveryCodeMessage(email: string, code: string) {
    await this.emailAdapter.sendEmail(
      email,
      'Its yours new confirmation code',
      ` <h1>Password recovery</h1>
                       <p>To finish password recovery please follow the link below:
                       <a href='https://somesite.com/password-recovery?recoveryCode=${code}'>recovery password</a>
                       </p>
    `,
    );
  }
}
