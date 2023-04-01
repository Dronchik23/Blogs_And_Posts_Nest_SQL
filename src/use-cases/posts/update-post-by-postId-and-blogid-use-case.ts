import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostDBType } from '../../types and models/types';
import { PostsRepository } from '../../posts/post.repository';

export class UpdatePostCommand {
  constructor(
    public postId: string,
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: string,
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostService implements ICommandHandler<UpdatePostCommand> {
  constructor(
    @InjectModel('Post') private readonly postsModel: Model<PostDBType>,
    private readonly postsRepository: PostsRepository,
  ) {}

  async execute(command: UpdatePostCommand): Promise<boolean> {
    return this.postsRepository.updatePostByPostIdAndBlogId(
      command.postId,
      command.title,
      command.shortDescription,
      command.content,
      command.blogId,
    );
  }
}
