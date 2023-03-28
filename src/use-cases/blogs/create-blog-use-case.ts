import { BlogsRepository } from '../../blogs/blog.repository';
import { BlogViewModel } from '../../types and models/models';
import { ObjectId } from 'mongodb';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogDBType, BlogOwnerInfoType } from '../../types and models/types';

export class CreateBlogCommand {
  constructor(
    public name: string,
    public description: string,
    public websiteUrl: string,
  ) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogService implements ICommandHandler<CreateBlogCommand> {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(command: CreateBlogCommand): Promise<BlogViewModel> {
    const newBlog = new BlogDBType(
      new ObjectId(),
      command.name,
      command.description,
      command.websiteUrl,
      new Date().toISOString(),
      false,
      new BlogOwnerInfoType(),
    );

    return await this.blogsRepository.createBlog(newBlog);
  }
}
