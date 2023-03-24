import { ObjectId } from 'mongodb';
import { injectable } from 'inversify';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  CommentDBType,
  LikeDBType,
  LikeStatus,
  PaginationType,
} from '../types and models/types';
import { CommentViewModel, UserViewModel } from '../types and models/models';
import {
  CommentDocument,
  Like,
  LikeDocument,
} from '../types and models/schemas';
import { Comment } from '../types and models/schemas';

@injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel('Comment')
    private readonly commentsModel: Model<CommentDocument>,
    @InjectModel('Like') private readonly likesModel: Model<LikeDocument>,
  ) {}

  private fromCommentDBTypeToCommentViewModel = (
    comment: Comment,
  ): CommentViewModel => {
    return {
      id: comment._id.toString(),
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentatorInfo.userId.toString(),
        userLogin: comment.commentatorInfo.userLogin,
      },
      createdAt: comment.createdAt.toString(),
      likesInfo: comment.likesInfo,
    };
  };
  private fromCommentDBTypeToCommentViewModelWithPagination = (
    comment: CommentDBType[],
  ): CommentViewModel[] => {
    return comment.map((comment) => ({
      id: comment._id.toString(),
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentatorInfo.userId.toString(),
        userLogin: comment.commentatorInfo.userLogin,
      },
      createdAt: comment.createdAt.toString(),
      likesInfo: comment.likesInfo,
    }));
  };

  async findCommentsByPostId(
    postId: string,
    pageNumber: number,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    userId?: string,
  ): Promise<PaginationType> {
    const comments: CommentDBType[] = await this.commentsModel
      .find({ postId: postId })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .lean();
    const commentsWithLikesInfo = await Promise.all(
      comments.map(async (comment) => {
        return this.getLikesInfoForComment(comment, userId);
      }),
    );

    const mappedComments =
      this.fromCommentDBTypeToCommentViewModelWithPagination(
        commentsWithLikesInfo,
      );

    const totalCount = await this.commentsModel.countDocuments({
      postId: postId,
    });
    const pagesCount = Math.ceil(totalCount / +pageSize);
    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedComments,
    };
  }

  async findCommentByCommentId(
    commentId: string,
    userId?: string,
  ): Promise<CommentViewModel | null> {
    console.log('commentId repo', commentId);
    console.log('userId repo', userId);
    const comment = await this.commentsModel
      .findOne({
        _id: new mongoose.Types.ObjectId(commentId),
      })
      .exec();

    if (!comment) return null;

    const commentWithLikesInfo = await this.getLikesInfoForComment(
      comment,
      userId,
    );
    return this.fromCommentDBTypeToCommentViewModel(commentWithLikesInfo);
  }

  private async getLikesInfoForComment(comment: any, userId?: string) {
    comment.likesInfo.likesCount = await this.likesModel.countDocuments({
      parentId: comment._id,
      status: LikeStatus.Like,
    });
    comment.likesInfo.dislikesCount = await this.likesModel.countDocuments({
      parentId: comment._id,
      status: LikeStatus.Dislike,
    });
    if (userId) {
      const status: LikeDBType = await this.likesModel
        .findOne({
          parentId: comment._id,
          userId: new ObjectId(userId),
        })
        .lean();
      if (status) {
        comment.likesInfo.myStatus = status.status;
      }
    }
    return comment;
  }
}
