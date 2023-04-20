import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../sa/users/users-repository';

export class DeleteUserCommand {
  constructor(public userId: string) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserService implements ICommandHandler<DeleteUserCommand> {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(command: DeleteUserCommand): Promise<boolean> {
    debugger;
    return await this.usersRepository.deleteUserByUserId(command.userId);
  }
}
