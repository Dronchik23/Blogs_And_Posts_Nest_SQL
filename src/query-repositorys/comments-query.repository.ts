import { ObjectId } from 'mongodb';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BlogDBType,
  CommentDBType,
  LikeDBType,
  LikeStatus,
  PaginationType,
  PostDBType,
  UserDBType,
} from '../types and models/types';
import { CommentViewModel } from '../types and models/models';
import {
  BlogDocument,
  CommentDocument,
  LikeDocument,
  PostDocument,
} from '../types and models/schemas';
import { UsersQueryRepository } from './users-query.repository';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel('Comment')
    private readonly commentsModel: Model<CommentDocument>,

    @InjectModel('Like') private readonly likesModel: Model<LikeDocument>,

    private readonly usersQueryRepo: UsersQueryRepository,

    @InjectModel('Blog') private readonly blogsModel: Model<BlogDocument>,

    @InjectModel('Post') private readonly postsModel: Model<PostDocument>,
  ) {}

  private fromCommentDBTypeToCommentViewModel = (
    comment: CommentDBType,
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
      pagesCount: pagesCount === 0 ? 1 : pagesCount, //
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedComments,
    };
  }

  async findCommentByCommentId(
    commentId: string,
    userId?: string,
  ): Promise<CommentViewModel> {
    try {
      const bannedUserIds = (await this.usersQueryRepo.findBannedUsers()).map(
        (user: UserDBType) => user._id,
      );
      const comment: CommentDBType = await this.commentsModel
        .findOne({
          _id: new ObjectId(commentId),
          'commentatorInfo.userId': { $nin: bannedUserIds },
        })
        .lean();

      const commentWithLikesInfo = await this.getLikesInfoForComment(
        comment,
        userId,
      );
      return this.fromCommentDBTypeToCommentViewModel(commentWithLikesInfo);
    } catch (error) {
      throw new NotFoundException();
    }
  }

  private async getLikesInfoForComment(
    comment: CommentDBType,
    userId?: string,
  ) {
    const bannedUserIds = (await this.usersQueryRepo.findBannedUsers()).map(
      (user: UserDBType) => user._id,
    ); // take userIds of banned Users
    comment.likesInfo.likesCount = await this.likesModel.countDocuments({
      parentId: comment._id,
      status: LikeStatus.Like,
      userId: { $nin: bannedUserIds }, // exclude banned users
    });
    comment.likesInfo.dislikesCount = await this.likesModel.countDocuments({
      parentId: comment._id,
      status: LikeStatus.Dislike,
      userId: { $nin: bannedUserIds }, // exclude banned users
    });
    if (userId) {
      const user = await this.usersQueryRepo.findUserByUserId(userId);
      if (user.banInfo.isBanned === true) {
        comment.likesInfo.myStatus = LikeStatus.None;
      } else {
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
    }
    return comment;
  }

  async findAllCommentsForBlogOwner(
    searchNameTerm: string,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
    userId: string,
  ): Promise<PaginationType> {
    debugger;
    const bannedUserIds = (await this.usersQueryRepo.findBannedUsers()).map(
      (user: UserDBType) => user._id,
    );

    const filter = {
      'blogOwnerInfo.userId': userId,
    };

    const blogs: BlogDBType[] = await this.blogsModel.find(filter);

    const blogIds: string[] = blogs.map((blog: BlogDBType) =>
      blog._id.toString(),
    ); // find all blogIds of current user

    const posts: PostDBType[] = await this.postsModel.find({
      blogId: { $in: blogIds },
    });

    const postIds: string[] = posts.map((post: PostDBType) =>
      post._id.toString(),
    ); // find all postId of current user blogs

    const comments: CommentDBType[] = await this.commentsModel // find all comments for all posts of current user
      .find({
        postId: { $in: postIds },
        'commentatorInfo.userId': { $nin: bannedUserIds },
      })
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
      postId: { $in: postIds },
      'commentatorInfo.userId': { $nin: bannedUserIds },
      'blogOwnerInfo.userId': userId,
    });

    const pagesCount = Math.ceil(totalCount / +pageSize);

    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount, //
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedComments,
    };
  }
}
