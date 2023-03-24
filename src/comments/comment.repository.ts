import { ObjectId } from 'mongodb';
import { injectable } from 'inversify';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { CommentDBType } from '../types and models/types';
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

  async createComment(
    commentForSave: CommentDBType,
  ): Promise<CommentViewModel> {
    const newComment = await this.commentsModel.create(commentForSave);
    return this.fromCommentDBTypeToCommentViewModel(newComment);
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

  async deleteCommentByCommentId(commentId: string, userId: string) {
    console.log('commentId repo', commentId);
    console.log('user repo', userId);
    try {
      const result = await this.commentsModel.deleteOne({
        _id: new mongoose.Types.ObjectId(commentId),
        'commentatorInfo.userId': new ObjectId(userId),
      });
      return result.deletedCount === 1 ? true : false;
    } catch {
      return false;
    }
  }

  async deleteAllComments() {
    const result = await this.commentsModel.deleteMany({});
    return result.deletedCount;
  }
}
