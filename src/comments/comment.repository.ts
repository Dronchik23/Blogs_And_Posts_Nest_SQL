import { ObjectId } from 'mongodb';
import { injectable } from 'inversify';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  CommentDBType,
  LikeDbType,
  LikeStatus,
} from '../types and models/types';
import { CommentViewModel, UserViewModel } from '../types and models/models';
import {
  CommentDocument,
  Like,
  LikeDocument,
} from '../types and models/schemas';
import { Comment } from '../types and models/schemas';

@injectable()
export class CommentsRepository {
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

  async createComment(
    commentForSave: CommentDBType,
  ): Promise<CommentViewModel> {
    const newComment = await this.commentsModel.create(commentForSave);
    return this.fromCommentDBTypeToCommentViewModel(newComment);
  }

  async findCommentsByPostId(
    postId: string,
    pageNumber: number,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    userId?: string,
  ): Promise<CommentViewModel[]> {
    const sortedComments: CommentDBType[] = await this.commentsModel
      .find({ postId: postId })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .lean();
    const commentsWithLikesInfo = await Promise.all(
      sortedComments.map(async (comment) => {
        return this.getLikesInfoForComment(comment, userId);
      }),
    );

    return this.fromCommentDBTypeToCommentViewModelWithPagination(
      commentsWithLikesInfo,
    );
  }

  async updateComment(commentId: string, content: string, user: UserViewModel) {
    const result = await this.commentsModel.updateOne(
      {
        _id: new ObjectId(commentId),
        'commentatorInfo.userId': new ObjectId(user.id),
      },
      {
        $set: {
          content: content,
        },
      },
    );
    return result.modifiedCount === 1;
  }

  async findCommentByCommentId(
    commentId: string,
    userId?: string,
  ): Promise<CommentViewModel | null> {
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
      const status: LikeDbType = await this.likesModel
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

  async getPostsCount(postId: string) {
    return this.commentsModel.countDocuments({ postId: postId });
  }

  async deleteCommentById(id: string, user: UserViewModel) {
    try {
      const result = await this.commentsModel.deleteOne({
        _id: new mongoose.Types.ObjectId(id),
        'commentatorInfo.userId': new ObjectId(user.id),
      });
      if (result.deletedCount === 1) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  async deleteAllComments() {
    const result = await this.commentsModel.deleteMany({});
    return result.deletedCount;
  }
}
