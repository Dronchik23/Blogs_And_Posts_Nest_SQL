import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CommentatorInfoType,
  CommentDBType,
  LikesInfoType,
  PostInfoType,
} from '../../types and models/types';
import { CommentsRepository } from '../../comments/comment.repository';
import { CommentViewModel, PostViewModel } from '../../types and models/models';
import { PostsQueryRepository } from '../../query-repositorys/posts-query.repository';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';
import { ForbiddenException } from '@nestjs/common';

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
    private readonly commentsRepository: CommentsRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  async execute(
    command: CreateCommentCommand,
  ): Promise<CommentViewModel | null> {
    const post: PostViewModel | null =
      await this.postsQueryRepository.findPostByPostId(command.postId);

    if (!post) {
      return null;
    }

    const user: any =
      await this.usersQueryRepository.findUserByUserIdWithDBType(
        command.user.id,
      );

    if (user.banInfo.blogId === post.blogId) {
      throw new ForbiddenException();
    }

    const createdAt = new Date().toISOString();

    return await this.commentsRepository.createComment(
      command.content,
      command.user.id,
      command.user.login,
      createdAt,
      post.id,
      post.title,
      post.blogId,
      post.blogName,
    );
  }
}
