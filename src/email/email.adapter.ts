import { Injectable, Scope } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable({ scope: Scope.DEFAULT })
export class EmailAdapter {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendEmail(email: string, subject: string, message: string) {
    console.log('email will be sent');
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASSWORD');

    this.mailerService.sendMail({
      to: email,
      subject: subject,
      html: message,
      from: 'Drone <' + user + '>',
    });
  }
}
