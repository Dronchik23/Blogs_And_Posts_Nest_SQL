import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsQueryRepository } from '../../query-repositorys/blogs-query.repository';
import { BlogDBType } from '../../types and models/types';
import { BlogsRepository } from '../../blogs/blog.repository';

export class BanBlogByBlogIdCommand {
  constructor(public blogId: string, public isBanned: boolean) {}
}

@CommandHandler(BanBlogByBlogIdCommand)
export class BanBlogByBlogIdService
  implements ICommandHandler<BanBlogByBlogIdCommand>
{
  constructor(
    private readonly blogsQueryRepo: BlogsQueryRepository,
    private readonly blogsRepo: BlogsRepository,
  ) {}

  async execute(command: BanBlogByBlogIdCommand): Promise<boolean> {
    const blog: BlogDBType =
      await this.blogsQueryRepo.findBlogByBlogIdWithBlogDBType(command.blogId);
    if (blog.banInfo.isBanned === command.isBanned) return null;
    const banDate = new Date().toISOString();
    return await this.blogsRepo.changeBanStatusForBlog(
      command.blogId,
      command.isBanned,
      banDate,
    );
  }
}
