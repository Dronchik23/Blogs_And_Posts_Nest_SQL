import { BlogDBType } from '../../types and models/types';
import { BlogsRepository } from '../../blogs/blog.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsQueryRepository } from '../../query-repositorys/blogs-query.repository';
import { ForbiddenException } from '@nestjs/common';
import { BlogUpdateModel } from '../../types and models/models';

export class UpdateBlogCommand {
  constructor(public blogId: string, public updateBlogDto: BlogUpdateModel) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogService implements ICommandHandler<UpdateBlogCommand> {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(command: UpdateBlogCommand): Promise<boolean> {
    return await this.blogsRepository.updateBlogByBlogId(
      command.blogId,
      command.updateBlogDto,
    );
  }
}
