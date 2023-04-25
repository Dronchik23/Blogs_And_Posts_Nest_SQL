import { BlogDBType } from '../../types and models/types';
import { BlogsRepository } from '../../blogs/blog.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsQueryRepository } from '../../query-repositorys/blogs-query.repository';
import { ForbiddenException } from '@nestjs/common';

export class UpdateBlogCommand {
  constructor(
    public id: string,
    public name: string,
    public websiteUrl: string,
  ) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogService implements ICommandHandler<UpdateBlogCommand> {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(command: UpdateBlogCommand): Promise<boolean> {
    return await this.blogsRepository.updateBlogByBlogId(
      command.id,
      command.name,
      command.websiteUrl,
    );
  }
}
