import { injectable } from 'inversify';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { FilterQuery, Model } from 'mongoose';
import {
  LikeDBType,
  LikeStatus,
  NewestLikesType,
  PaginationType,
  PostDBType,
  UserDBType,
} from '../types and models/types';
import { PostViewModel } from '../types and models/models';
import { LikeDocument, Post, PostDocument } from '../types and models/schemas';
import { ObjectId } from 'mongodb';
import { NotFoundException } from '@nestjs/common';
import { UsersQueryRepository } from './users-query.repository';

@injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel('Post') private readonly postsModel: Model<PostDocument>,
    @InjectModel('Like') private readonly likesModel: Model<LikeDocument>,
    private readonly usersQueryRepo: UsersQueryRepository,
  ) {}

  private fromPostDBTypePostViewModel = (post: Post): PostViewModel => {
    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId.toString(),
      blogName: post.blogName,
      createdAt: post.createdAt.toString(),
      extendedLikesInfo: {
        likesCount: post.extendedLikesInfo.likesCount,
        dislikesCount: post.extendedLikesInfo.dislikesCount,
        myStatus: post.extendedLikesInfo.myStatus,
        newestLikes: post.extendedLikesInfo.newestLikes,
      },
    };
  };
  private fromPostDBTypeToPostViewModelWithPagination = (
    posts: PostDBType[],
  ): PostViewModel[] => {
    return posts.map((post) => ({
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt.toString(),
      extendedLikesInfo: {
        likesCount: post.extendedLikesInfo.likesCount,
        dislikesCount: post.extendedLikesInfo.dislikesCount,
        myStatus: post.extendedLikesInfo.myStatus,
        newestLikes: post.extendedLikesInfo.newestLikes,
      },
    }));
  };

  async findAllPosts(
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
    userId?: string,
  ): Promise<PaginationType> {
    const posts: PostDBType[] = await this.postsModel
      .find({})
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .lean();

    for (const post of posts) {
      await this.getLikesInfoForPost(post, userId);
    }

    const mappedPosts = this.fromPostDBTypeToPostViewModelWithPagination(posts);

    const totalCount = await this.getAllPostCount();

    const pagesCount = Math.ceil(totalCount / +pageSize);
    // exclude 0

    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount, // exclude 0
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedPosts,
    };
  }
  async findPostByPostId(
    postId: string,
    userId?: string,
  ): Promise<PostViewModel | null> {
    try {
      const post = await this.postsModel
        .findOne({
          _id: new ObjectId(postId),
        })
        .exec();

      const postWithLikesInfo = await this.getLikesInfoForPost(post, userId);

      return this.fromPostDBTypePostViewModel(postWithLikesInfo);
    } catch (error) {
      throw new NotFoundException();
    }
  }

  async findPostsByBlogId(
    blogId: string,
    pageNumber: number,
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    userId?: string,
  ) {
    const posts: PostDBType[] = await this.postsModel
      .find({ blogId: blogId })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .lean();

    for (const post of posts) {
      await this.getLikesInfoForPost(post, userId);
    }
    const mappedPosts = this.fromPostDBTypeToPostViewModelWithPagination(posts);

    const totalCount = await this.getPostsCount({
      blogId,
    });

    return {
      pagesCount: Math.ceil(totalCount / +pageSize),
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedPosts,
    };
  }

  async getPostsCount(filter: FilterQuery<PostDBType>) {
    return this.postsModel.countDocuments(filter);
  }
  private mapNewestLikes(likes: LikeDBType[]): NewestLikesType[] {
    return likes.map((like) => ({
      addedAt: like.addedAt,
      userId: like.userId.toString(),
      login: like.userLogin,
    }));
  }
  private async getLikesInfoForPost(post: any, userId?: string) {
    const bannedUserIds = (await this.usersQueryRepo.findBannedUsers()).map(
      (u) => u._id,
    );
    post.extendedLikesInfo.likesCount = await this.likesModel.countDocuments({
      parentId: new ObjectId(post._id),
      status: LikeStatus.Like,
      userId: { $nin: bannedUserIds }, // exclude banned users
    });
    post.extendedLikesInfo.dislikesCount = await this.likesModel.countDocuments(
      {
        parentId: new ObjectId(post._id),
        status: LikeStatus.Dislike,
        userId: { $nin: bannedUserIds }, // exclude banned users
      },
    );
    const newestLikes: any = await this.likesModel
      .find({
        parentId: new ObjectId(post._id),
        status: LikeStatus.Like,
        userId: { $nin: bannedUserIds },
      })
      .sort({ addedAt: -1 })
      .limit(3)
      .exec();

    post.extendedLikesInfo.newestLikes = this.mapNewestLikes(newestLikes);

    if (userId) {
      const user = await this.usersQueryRepo.findUserByUserId(userId);
      if (user.banInfo.isBanned === true) {
        post.extendedLikesInfo.myStatus = 'None';
      } else {
        const status: LikeDBType = await this.likesModel
          .findOne({
            parentId: new ObjectId(post._id),
            userId: new ObjectId(userId),
          })
          .lean();
        if (status) {
          post.likesInfo.myStatus = status.status;
        }
      }
    }
    return post;
  }

  async getAllPostCount() {
    return this.postsModel.countDocuments();
  }
}
