import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as bcrypt from 'bcrypt';
import { add } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { UsersRepository } from '../../sa/users/users-repository';
import { UserViewModel } from '../../types and models/models';
import { EmailService } from '../../email/email.service';

export class CreateUserCommand {
  constructor(
    public login: string,
    public email: string,
    public password: string,
  ) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserService implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: CreateUserCommand): Promise<UserViewModel> {
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(command.password, passwordSalt);
    const confirmationCode = uuidv4();
    const createdAt = new Date().toISOString();
    const confirmationExpirationDate = add(new Date(), {
      hours: 2,
      minutes: 3,
    });
    const isEmailConfirmed = false;
    const recoveryCode = null;
    const isRecoveryConfirmed = true;
    const result: UserViewModel = await this.usersRepository.createUser(
      command.login,
      command.email,
      passwordHash,
      createdAt,
      confirmationCode,
      confirmationExpirationDate,
      isEmailConfirmed,
      recoveryCode,
      isRecoveryConfirmed,
    );

    try {
      await this.emailService.sendEmailRegistrationMessage(
        command.email,
        confirmationCode,
      );
    } catch (err) {
      console.error(err);
    }
    return result;
  }
}
