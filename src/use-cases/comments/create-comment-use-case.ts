import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CommentatorInfoType,
  CommentDBType,
  LikesInfoType,
  PostInfoType,
  UserDBType,
} from '../../types and models/types';
import { CommentsRepository } from '../../comments/comment.repository';
import {
  CommentInputModel,
  CommentViewModel,
  PostViewModel,
  UserViewModel,
} from '../../types and models/models';
import { PostsQueryRepository } from '../../query-repositorys/posts-query.repository';
import { UsersQueryRepository } from '../../query-repositorys/users-query.repository';
import { ForbiddenException } from '@nestjs/common';

export class CreateCommentCommand {
  constructor(
    public postId: string,
    public commentCreateDTO: CommentInputModel,
    public user: UserViewModel,
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

    const user: UserDBType =
      await this.usersQueryRepository.findUserByUserIdWithDBType(
        command.user.id,
      );

    if (user.blogId === post.blogId) {
      throw new ForbiddenException();
    }

    if (user.isBanned === true) {
      throw new ForbiddenException();
    }

    return await this.commentsRepository.createComment(
      command.commentCreateDTO,
      command.user,
      post,
    );
  }
}
