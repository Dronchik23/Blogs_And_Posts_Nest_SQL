import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';
import { UsersRepository } from '../../sa/users/users-repository.service';

export class BanUserByUserIdCommand {
  constructor(
    public userId: string,
    public isBanned: boolean,
    public banReason: string,
  ) {}
}

@CommandHandler(BanUserByUserIdCommand)
export class BanUserByUserIService
  implements ICommandHandler<BanUserByUserIdCommand>
{
  constructor(
    private readonly userQueryRepo: UsersQueryRepository,
    private readonly userRepo: UsersRepository,
  ) {}

  async execute(command: BanUserByUserIdCommand): Promise<boolean> {
    const user = await this.userQueryRepo.findUserByUserId(command.userId);
    if (user.banInfo.isBanned === command.isBanned) return null;
    const banDate = new Date().toISOString();
    return await this.userRepo.changeBanStatusForUser(
      command.userId,
      command.isBanned,
      command.banReason,
      banDate,
    );
  }
}
