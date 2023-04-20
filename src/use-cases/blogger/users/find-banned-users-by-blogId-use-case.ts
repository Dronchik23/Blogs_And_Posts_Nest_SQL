import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../query-repositorys/users-query.repository';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BlogsQueryRepository } from '../../../query-repositorys/blogs-query.repository';
import {
  BlogDBType,
  BlogOwnerInfoType,
  PaginationType,
} from '../../../types and models/types';
import { BlogViewModel } from '../../../types and models/models';

export class findBannedUsersByBlogIdCommand {
  constructor(
    public currentUserId: string,
    public blogId: string,
    public pageNumber: number,
    public pageSize: number,
    public sortBy: string,
    public sortDirection: string,
    public searchLoginTerm: string,
  ) {}
}

@CommandHandler(findBannedUsersByBlogIdCommand)
export class FindBannedUsersByBlogIdService
  implements ICommandHandler<findBannedUsersByBlogIdCommand>
{
  constructor(
    private readonly usersQueryRepo: UsersQueryRepository,
    private readonly blogsQueryRepo: BlogsQueryRepository,
  ) {}

  async execute(command: findBannedUsersByBlogIdCommand): Promise<any> {
    const blog: BlogViewModel = await this.blogsQueryRepo.findBlogByBlogId(
      command.blogId,
    );
    if (!blog) {
      throw new NotFoundException();
    }
    if (blog.blogOwnerInfo.userId !== command.currentUserId) {
      throw new ForbiddenException();
    }
    const bannedUsers: PaginationType =
      await this.usersQueryRepo.findBannedUsersByBlogId(
        command.blogId,
        command.pageNumber,
        command.pageSize,
        command.sortBy,
        command.sortDirection,
        command.searchLoginTerm,
      );
    if (!bannedUsers) {
      throw new NotFoundException();
    }

    return bannedUsers;
  }
}
