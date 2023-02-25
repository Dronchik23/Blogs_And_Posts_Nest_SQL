import { ObjectId } from 'mongodb';
import { injectable } from 'inversify';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
import { PostsRepository } from '../posts/post.repository';
import { CommentsRepository } from './comment.repository';

@injectable()
export class CommentsService {
  constructor(
    protected postsRepository: PostsRepository,
    protected commentsRepository: CommentsRepository,
  ) {}

  async createComment(
    postId: ObjectId,
    content: string,
    user: UserViewModel,
  ): Promise<CommentViewModel | null> {
    const post: PostViewModel | null = await this.postsRepository.findPostById(
      postId,
    );
    if (!post) {
      return null;
    }
    const newComment = new CommentDBType(
      new ObjectId(),
      content,
      new CommentatorInfoType(new ObjectId(user.id), user.login),
      new Date(),
      postId.toString(),
      new LikesInfoType(),
    );
    return await this.commentsRepository.createComment(newComment);
  }

  async findCommentsByPostId(
    postId: string,
    pageNumber: number,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    userId: ObjectId,
  ): Promise<any> {
    const foundComments = await this.commentsRepository.findCommentsByPostId(
      postId,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      userId,
    );
    const totalCount = await this.commentsRepository.getPostsCount(postId);
    const pagesCount = Math.ceil(totalCount / pageSize);
    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: foundComments,
    };
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

  async findCommentByCommentId(
    commentId: string,
    userId?: ObjectId,
  ): Promise<any> {
    return await this.commentsRepository.findCommentById(commentId, userId);
  }

  async deleteCommentByCommentId(commentId: string, user: UserViewModel) {
    return await this.commentsRepository.deleteCommentById(commentId, user);
  }
}
