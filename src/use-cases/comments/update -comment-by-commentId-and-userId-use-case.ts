import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
  constructor(
    @InjectModel('Comment') private readonly postsModel: Model<CommentDBType>,
    private readonly commentsRepository: CommentsRepository,
  ) {}

  async execute(command: UpdateCommentCommand): Promise<boolean> {
    return await this.commentsRepository.updateComment(
      command.commentId,
      command.content,
      command.userId,
    );
  }
}
