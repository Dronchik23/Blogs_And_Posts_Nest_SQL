import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.DEFAULT })
export class MokEmailAdapter {
  async sendEmail(email: string, subject: string, message: string) {
    console.log('email will be sent');
  }
}
