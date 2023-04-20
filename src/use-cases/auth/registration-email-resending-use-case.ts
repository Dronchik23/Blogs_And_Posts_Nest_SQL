import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';
import { UsersRepository } from '../../sa/users/users-repository';
import { EmailService } from '../../email/email.service';

export class RegistrationEmailResendingCommand {
  constructor(public email: string) {}
}

@CommandHandler(RegistrationEmailResendingCommand)
export class RegistrationEmailResendingService
  implements ICommandHandler<RegistrationEmailResendingCommand>
{
  constructor(
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: RegistrationEmailResendingCommand): Promise<boolean> {
    const user = await this.usersQueryRepository.findUserByEmail(command.email);
    if (!user) return false;
    const newCode = randomUUID();
    await this.usersRepository.updateConfirmationCodeByUserId(
      user._id,
      newCode,
    );
    await this.emailService.resendingEmailMessage(
      user.accountData.email,
      newCode,
    );
    return true;
  }
}
