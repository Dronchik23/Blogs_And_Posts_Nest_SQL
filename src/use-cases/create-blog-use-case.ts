import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlogDBType } from '../types and models/types';
import { BlogsRepository } from '../blogs/blog.repository';
import { BlogViewModel } from '../types and models/models';
import { ObjectId } from 'mongodb';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreateBlogCommand {
  constructor(
    public name: string,
    public description: string,
    public websiteUrl: string,
  ) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogService implements ICommandHandler<CreateBlogCommand> {
  constructor(
    @InjectModel('Blog') private readonly blogsModel: Model<BlogDBType>,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async execute(command: CreateBlogCommand): Promise<BlogViewModel> {
    const newBlog = new this.blogsModel({
      _id: new ObjectId(),
      nme: command.name,
      description: command.description,
      websiteUrl: command.websiteUrl,
      createdAt: new Date().toISOString(),
      isMembership: false,
    });
    return await this.blogsRepository.createBlog(newBlog);
  }
}
