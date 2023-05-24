import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikesRepository } from '../../likes/like.repository';
import { LikeInputModel, UserViewModel } from '../../models/models';

export class CommentUpdateLikeStatusCommand {
  constructor(
    public commentId: string,
    public user: UserViewModel,
    public likeStatusDTO: LikeInputModel,
  ) {}
}

@CommandHandler(CommentUpdateLikeStatusCommand)
export class CommentUpdateLikeStatusService
  implements ICommandHandler<CommentUpdateLikeStatusCommand>
{
  constructor(private readonly likesRepository: LikesRepository) {}

  async execute(command: CommentUpdateLikeStatusCommand): Promise<any> {
    return await this.likesRepository.commentsUpdateLikeStatus(
      command.commentId,
      command.user,
      command.likeStatusDTO,
    );
  }
}
