import { BlogsRepository } from '../../blogs/blog.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserViewModel } from '../../types and models/models';

export class BindBlogToUserCommand {
  constructor(public blogId: string, public user: UserViewModel) {}
}

@CommandHandler(BindBlogToUserCommand)
export class BindBlogToUserService
  implements ICommandHandler<BindBlogToUserCommand>
{
  constructor(
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async execute(command: BindBlogToUserCommand): Promise<boolean> {
    return await this.blogsRepository.bindBlogToUser(
      command.blogId,
      command.user,
    );
  }
}
