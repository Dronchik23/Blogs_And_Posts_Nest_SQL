import { BlogsRepository } from '../../blogs/blog.repository';
import { BlogViewModel } from '../../types and models/models';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreateBlogCommand {
  constructor(
    public name: string,
    public description: string,
    public websiteUrl: string,
    public userId: string,
    public login: string,
  ) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogService implements ICommandHandler<CreateBlogCommand> {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(command: CreateBlogCommand): Promise<BlogViewModel> {
    const createdAt = new Date().toISOString();

    return await this.blogsRepository.createBlog(
      command.name,
      command.description,
      command.websiteUrl,
      createdAt,
      command.userId,
      command.login,
    );
  }
}
