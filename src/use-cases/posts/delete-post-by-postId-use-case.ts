import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostDBType } from '../../types and models/types';
import { PostsRepository } from '../../posts/post.repository';

export class DeletePostCommand {
  constructor(public blogId: string, public postId: string) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostService implements ICommandHandler<DeletePostCommand> {
  constructor(
    @InjectModel('Post') private readonly postsModel: Model<PostDBType>,
    private readonly postsRepository: PostsRepository,
  ) {}

  async execute(command: DeletePostCommand): Promise<boolean> {
    return await this.postsRepository.deletePostByPostIdAndBlogId(
      command.blogId,
      command.postId,
    );
  }
}
