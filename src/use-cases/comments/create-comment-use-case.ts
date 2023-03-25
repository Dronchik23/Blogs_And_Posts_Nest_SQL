import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CommentatorInfoType,
  CommentDBType,
  LikesInfoType,
  PostDBType,
} from '../../types and models/types';
import { CommentsRepository } from '../../comments/comment.repository';
import { CommentViewModel, PostViewModel } from '../../types and models/models';
import { ObjectId } from 'mongodb';
import { PostsQueryRepository } from '../../query-repositorys/posts-query.repository';

export class CreateCommentCommand {
  constructor(
    public postId: string,
    public content: string,
    public user: any,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentService
  implements ICommandHandler<CreateCommentCommand>
{
  constructor(
    @InjectModel('Comment') private readonly postsModel: Model<CommentDBType>,
    private readonly commentsRepository: CommentsRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  async execute(
    command: CreateCommentCommand,
  ): Promise<CommentViewModel | null> {
    const post: PostViewModel | null =
      await this.postsQueryRepository.findPostByPostId(command.postId);
    if (!post) {
      return null;
    }
    const newComment = new CommentDBType(
      new ObjectId(),
      command.content,
      new CommentatorInfoType(
        new ObjectId(command.user.id),
        command.user.login,
      ),
      new Date().toISOString(),
      command.postId.toString(),
      new LikesInfoType(),
    );
    return await this.commentsRepository.createComment(newComment);
  }
}
