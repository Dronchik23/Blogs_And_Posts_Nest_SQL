import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlogDBType } from '../../types and models/types';
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
    @InjectModel('Blog') private readonly blogsModel: Model<BlogDBType>,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async execute(command: BindBlogToUserCommand): Promise<boolean> {
    return await this.blogsRepository.bindBlogToUser(
      command.blogId,
      command.user,
    );
  }
}
