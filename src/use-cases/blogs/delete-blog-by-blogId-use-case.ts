import { BlogsRepository } from '../../blogs/blog.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class DeleteBlogCommand {
  constructor(public id: string) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogService implements ICommandHandler<DeleteBlogCommand> {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(command: DeleteBlogCommand): Promise<boolean> {
    return await this.blogsRepository.deleteBlogByBlogId(command.id);
  }
}
