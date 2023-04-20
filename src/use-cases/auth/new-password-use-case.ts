import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../sa/users/users-repository';
import * as bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';

export class NewPasswordCommand {
  constructor(public password: string, public userId: string) {}
}

@CommandHandler(NewPasswordCommand)
export class NewPasswordService implements ICommandHandler<NewPasswordCommand> {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(command: NewPasswordCommand) {
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(command.password, passwordSalt);
    await this.usersRepository.updatePassword(
      passwordHash,
      new ObjectId(command.userId),
    );
    return;
  }
}
