import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../posts/post.repository';
import { PostUpdateModel } from '../../models/models';

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
