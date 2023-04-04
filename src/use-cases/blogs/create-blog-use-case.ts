import { BlogsRepository } from '../../blogs/blog.repository';
import { BlogViewModel, UserViewModel } from '../../types and models/models';
import { ObjectId } from 'mongodb';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogDBType, BlogOwnerInfoType } from '../../types and models/types';

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
    const blogOwnerInfo = new BlogOwnerInfoType();
    blogOwnerInfo.userId = command.userId;
    blogOwnerInfo.userLogin = command.login;

    const newBlog = new BlogDBType(
      new ObjectId(),
      command.name,
      command.description,
      command.websiteUrl,
      new Date().toISOString(),
      false,
      blogOwnerInfo,
    );

    return await this.blogsRepository.createBlog(newBlog);
  }
}
