import { Controller, Inject, Post, Body } from '@nestjs/common';
import { EmailService } from './email.controller';

@Controller('emails')
export class EmailController {
  constructor(
    @Inject(EmailService) private readonly emailService: EmailService,
  ) {}

  @Post()
  async sendEmail(
    @Body('email') email: string,
    @Body('subject') subject: string,
    @Body('message') message: string,
  ) {
    await this.emailService.sendEmail(email, subject, message);
    return { success: true };
  }
}
