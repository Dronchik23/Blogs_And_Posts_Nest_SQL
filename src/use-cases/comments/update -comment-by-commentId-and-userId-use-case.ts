import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentDBType, PostDBType } from '../../types and models/types';
import { CommentsRepository } from '../../comments/comment.repository';

export class UpdateCommentCommand {
  constructor(
    public commentId: string,
    public content: string,
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
        command.content,
        command.userId,
      );
    return a;
  }
}
