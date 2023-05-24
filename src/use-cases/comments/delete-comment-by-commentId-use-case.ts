import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../comments/comment.repository';

export class DeleteCommentCommand {
  constructor(public commentId: string, public userId: string) {}
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentService
  implements ICommandHandler<DeleteCommentCommand>
{
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async execute(command: DeleteCommentCommand): Promise<boolean> {
    return await this.commentsRepository.deleteCommentByCommentIdAndUserId(
      command.commentId,
      command.userId,
    );
  }
}
