import { UserDBType } from '../types and models/types';
import { emailAdapter } from './email.adapter';

export class EmailService {
  async sendEmail(email: any, subject: string, message: string) {
    await emailAdapter.sendEmail(email, subject, message);
  }
  async sendEmailRegistrationMessage(user: UserDBType) {
    const code = user.emailConfirmation.confirmationCode;
    await emailAdapter.sendEmail(
      user.accountData.email,
      'Confirm your email',
      `<a href='https://blogs-and-posts-ver2-dgfu.vercel.app/auth/registration-confirmation?code=${code}'>complete registration</a>`,
    );
  }
  async resendingEmailMessage(email: string, code: string) {
    await emailAdapter.sendEmail(
      email,
      'Its yours new confirmation code',
      `<a href='https://blogs-and-posts-ver2-dgfu.vercel.app/auth/registration-email-resending?code=${code}'>new confirmation code</a>`,
    );
  }
  async recoveryCodeMessage(email: string, code: string) {
    await emailAdapter.sendEmail(
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
