import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../query-repositorys/users-query.repository';
import { UsersRepository } from '../../../sa/users/users-repository';
import { BlogsQueryRepository } from '../../../query-repositorys/blogs-query.repository';
import { BlogDBType } from '../../../types and models/types';
import { ForbiddenException } from '@nestjs/common';

export class BanUserByUserIdByBloggerCommand {
  constructor(
    public currentUserId: string,
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
    private readonly blogsQueryRepo: BlogsQueryRepository,
  ) {}

  async execute(command: BanUserByUserIdByBloggerCommand): Promise<any> {
    const user = await this.userQueryRepo.findUserByUserId(command.userId);
    if (user.banInfo.isBanned === command.isBanned) return null;
    const blog: BlogDBType =
      await this.blogsQueryRepo.findBlogByBlogIdWithBlogDBType(command.blogId);
    if (blog.blogOwnerId !== command.currentUserId) {
      throw new ForbiddenException();
    }
    const banDate = new Date().toISOString();
    const a: any = await this.userRepo.changeBanStatusForUserByBlogger(
      command.userId,
      command.isBanned,
      command.banReason,
      banDate,
      command.blogId,
    );
    return a;
  }
}
