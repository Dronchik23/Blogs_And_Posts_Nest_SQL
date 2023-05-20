import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikeStatus } from '../../types and models/types';
import { LikesRepository } from '../../likes/like.repository';
import { LikeInputModel, UserViewModel } from '../../types and models/models';

export class PostUpdateLikeStatusCommand {
  constructor(
    public postId: string,
    public user: UserViewModel,
    public likeStatusDTO: LikeInputModel,
  ) {}
}

@CommandHandler(PostUpdateLikeStatusCommand)
export class PostUpdateLikeStatusService
  implements ICommandHandler<PostUpdateLikeStatusCommand>
{
  constructor(private readonly likesRepository: LikesRepository) {}

  async execute(command: PostUpdateLikeStatusCommand): Promise<any> {
    return await this.likesRepository.postsUpdateLikeStatus(
      command.postId,
      command.user,
      command.likeStatusDTO,
    );
  }
}
