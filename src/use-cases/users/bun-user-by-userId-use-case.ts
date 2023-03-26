import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';
import { UsersRepository } from '../../sa/users/users-repository.service';

export class BunUserByUserIdCommand {
  constructor(
    public userId: string,
    public isBanned: boolean,
    public banReason: string,
  ) {}
}

@CommandHandler(BunUserByUserIdCommand)
export class BunUserByUserIService
  implements ICommandHandler<BunUserByUserIdCommand>
{
  constructor(
    private readonly userQueryRepo: UsersQueryRepository,
    private readonly userRepo: UsersRepository,
  ) {}

  async execute(command: BunUserByUserIdCommand): Promise<boolean> {
    const user = await this.userQueryRepo.findUserByUserId(command.userId);
    if (!user) return null;
    if (user.banInfo.isBanned === command.isBanned) return null;
    const banDate = new Date().toISOString();
    return await this.userRepo.changeBunStatusForUser(
      command.userId,
      command.isBanned,
      command.banReason,
      banDate,
    );
  }
}
