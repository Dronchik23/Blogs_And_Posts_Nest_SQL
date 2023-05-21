import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../../sa/users/users-repository';
import { UserInputModel, UserViewModel } from '../../types and models/models';

export class CreateUserCommand {
  constructor(public createUserDTO: UserInputModel) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserService implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(command: CreateUserCommand): Promise<UserViewModel> {
    const passwordSalt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(
      command.createUserDTO.password,
      passwordSalt,
    );

    const result: UserViewModel = await this.usersRepository.createUserBySA(
      command.createUserDTO,
      passwordHash,
    );

    return result;
  }
}
