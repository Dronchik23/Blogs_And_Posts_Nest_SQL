import { BlogsRepository } from '../../blogs/blog.repository';
import { BlogInputModel, BlogViewModel } from '../../models/models';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreateBlogCommand {
  constructor(
    public createBlogDTO: BlogInputModel,
    public userId: string,
    public login: string,
  ) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogService implements ICommandHandler<CreateBlogCommand> {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(command: CreateBlogCommand): Promise<BlogViewModel> {
    const blog: BlogViewModel = await this.blogsRepository.createBlog(
      command.createBlogDTO,
      command.userId,
      command.login,
    );
    return blog;
  }
}
