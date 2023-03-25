import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentDBType, PostDBType } from '../../types and models/types';
import { CommentsRepository } from '../../comments/comment.repository';

export class DeleteCommentCommand {
  constructor(public commentId: string, public userId: string) {}
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentService
  implements ICommandHandler<DeleteCommentCommand>
{
  constructor(
    @InjectModel('Comment') private readonly postsModel: Model<CommentDBType>,
    private readonly commentsRepository: CommentsRepository,
  ) {}

  async execute(command: DeleteCommentCommand): Promise<boolean> {
    return await this.commentsRepository.deleteCommentByCommentId(
      command.commentId,
      command.userId,
    );
  }
}
