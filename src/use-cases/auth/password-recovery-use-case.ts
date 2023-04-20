import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../sa/users/users-repository';
import { randomUUID } from 'crypto';
import { EmailService } from '../../email/email.service';

export class PasswordRecoveryCommand {
  constructor(public email: string) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryService
  implements ICommandHandler<PasswordRecoveryCommand>
{
  constructor(
    private readonly emailService: EmailService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(command: PasswordRecoveryCommand) {
    const newCode = randomUUID();
    await this.emailService.recoveryCodeMessage(command.email, newCode);
    await this.usersRepository.updatePasswordRecoveryCodeByEmail(
      command.email,
      newCode,
    );
    return;
  }
}
