import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UsersRepository } from '../../sa/users/users-repository';
import { UserInputModel, UserViewModel } from '../../models/models';
import { EmailService } from '../../email/email.service';

export class RegistrationUserCommand {
  constructor(public createUserDTO: UserInputModel) {}
}

@CommandHandler(RegistrationUserCommand)
export class RegistrationUserService
  implements ICommandHandler<RegistrationUserCommand>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: RegistrationUserCommand): Promise<UserViewModel> {
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(
      command.createUserDTO.password,
      passwordSalt,
    );
    const confirmationCode = uuidv4();
    const result: UserViewModel = await this.usersRepository.createUser(
      command.createUserDTO,
      passwordHash,
      confirmationCode,
    );

    try {
      await this.emailService.sendEmailRegistrationMessage(
        command.createUserDTO.email,
        confirmationCode,
      );
    } catch (err) {
      console.error(err);
    }
    return result;
  }
}
