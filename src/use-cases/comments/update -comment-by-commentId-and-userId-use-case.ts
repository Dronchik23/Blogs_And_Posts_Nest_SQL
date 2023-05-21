import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentDBType, PostDBType } from '../../types and models/types';
import { CommentsRepository } from '../../comments/comment.repository';
import { CommentUpdateModel } from '../../types and models/models';

export class UpdateCommentCommand {
  constructor(
    public commentId: string,
    public commentInputDTO: CommentUpdateModel,
    public userId: string,
  ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentService
  implements ICommandHandler<UpdateCommentCommand>
{
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async execute(command: UpdateCommentCommand): Promise<boolean> {
    const a: any =
      await this.commentsRepository.updateCommentByCommentIdAndUserId(
        command.commentId,
        command.commentInputDTO,
        command.userId,
      );
    return a;
  }
}
