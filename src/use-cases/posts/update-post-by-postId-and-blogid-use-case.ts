import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostDBType } from '../../types and models/types';
import { PostsRepository } from '../../posts/post.repository';
import { PostUpdateModel } from '../../types and models/models';

export class UpdatePostCommand {
  constructor(public postId: string, public postUpdateDTO: PostUpdateModel) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostService implements ICommandHandler<UpdatePostCommand> {
  constructor(private readonly postsRepository: PostsRepository) {}

  async execute(command: UpdatePostCommand): Promise<boolean> {
    return this.postsRepository.updatePostByPostId(
      command.postId,
      command.postUpdateDTO,
    );
  }
}
