import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';
import { UsersRepository } from '../../sa/users/users-repository';

export class BanUserByUserIdBySACommand {
  constructor(
    public userId: string,
    public isBanned: boolean,
    public banReason: string,
  ) {}
}

@CommandHandler(BanUserByUserIdBySACommand)
export class BanUserByUserIdService
  implements ICommandHandler<BanUserByUserIdBySACommand>
{
  constructor(
    private readonly userQueryRepo: UsersQueryRepository,
    private readonly userRepo: UsersRepository,
  ) {}

  async execute(command: BanUserByUserIdBySACommand): Promise<boolean> {
    const user = await this.userQueryRepo.findUserByUserId(command.userId);
    if (user.banInfo.isBanned === command.isBanned) return null;
    const banDate = new Date().toISOString();
    const a: any = await this.userRepo.changeBanStatusForUserBySA(
      command.userId,
      command.isBanned,
      command.banReason,
      banDate,
    );
    return a;
  }
}
