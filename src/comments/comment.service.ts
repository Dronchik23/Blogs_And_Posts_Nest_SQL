import { ObjectId } from 'mongodb';
import { injectable } from 'inversify';
import {
  CommentatorInfoType,
  CommentDBType,
  LikesInfoType,
} from '../types and models/types';
import {
  CommentViewModel,
  PostViewModel,
  UserViewModel,
} from '../types and models/models';
import { CommentsRepository } from './comment.repository';
import { PostsQueryRepository } from '../query-repositorys/posts-query.repository';

@injectable()
export class CommentsService {
  constructor(
    protected commentsRepository: CommentsRepository,
    protected postsQueryRepository: PostsQueryRepository,
  ) {}

  async createComment(
    postId: string,
    content: string,
    user: any,
  ): Promise<CommentViewModel | null> {
    const post: PostViewModel | null =
      await this.postsQueryRepository.findPostByPostId(postId);
    if (!post) {
      return null;
    }
    const newComment = new CommentDBType(
      new ObjectId(),
      content,
      new CommentatorInfoType(new ObjectId(user.id), user.login),
      new Date().toISOString(),
      postId.toString(),
      new LikesInfoType(),
    );
    return await this.commentsRepository.createComment(newComment);
  }

  async updateCommentByUserId(
    commentId: string,
    content: string,
    user: UserViewModel,
  ): Promise<any> {
    return await this.commentsRepository.updateComment(
      commentId,
      content,
      user,
    );
  }

  async deleteCommentByCommentId(commentId: string, userId: string) {
    return await this.commentsRepository.deleteCommentByCommentId(
      commentId,
      userId,
    );
  }
}
