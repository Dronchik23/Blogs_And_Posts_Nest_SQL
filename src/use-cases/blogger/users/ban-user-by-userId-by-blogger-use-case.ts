import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../query-repositorys/users-query.repository';
import { UsersRepository } from '../../../sa/users/users-repository';

export class BanUserByUserIdByBloggerCommand {
  constructor(
    public userId: string,
    public isBanned: boolean,
    public banReason: string,
    public blogId: string,
  ) {}
}

@CommandHandler(BanUserByUserIdByBloggerCommand)
export class BanUserByUserIdByBloggerService
  implements ICommandHandler<BanUserByUserIdByBloggerCommand>
{
  constructor(
    private readonly userQueryRepo: UsersQueryRepository,
    private readonly userRepo: UsersRepository,
  ) {}

  async execute(command: BanUserByUserIdByBloggerCommand): Promise<boolean> {
    const user = await this.userQueryRepo.findUserByUserId(command.userId);
    if (user.banInfo.isBanned === command.isBanned) return null;
    const banDate = new Date().toISOString();
    return await this.userRepo.changeBanStatusForUserByBlogger(
      command.userId,
      command.isBanned,
      command.banReason,
      banDate,
      command.blogId,
    );
  }
}
