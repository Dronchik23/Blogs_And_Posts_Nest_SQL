import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  LikeDBType,
  LikeStatus,
  NewestLikesType,
  PaginationType,
  PostDBType,
} from '../types and models/types';
import { PostViewModel } from '../types and models/models';
import { LikeDocument, PostDocument } from '../types and models/schemas';
import { ObjectId } from 'mongodb';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersQueryRepository } from './users-query.repository';
import { BlogsQueryRepository } from './blogs-query.repository';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel('Post') private readonly postsModel: Model<PostDocument>,
    @InjectModel('Like') private readonly likesModel: Model<LikeDocument>,
    private readonly usersQueryRepo: UsersQueryRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository,
  ) {}

  private fromPostDBTypePostViewModel = (post: PostDBType): PostViewModel => {
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
    const bannedBlogIds: string[] =
      await this.blogsQueryRepository.getBannedBlogsIds();

    const filter = { blogId: { $nin: bannedBlogIds } };
    const posts: PostDBType[] = await this.postsModel
      .find(filter)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .lean();

    for (const post of posts) {
      await this.getLikesInfoForPost(post, userId);
    }

    const totalCount = posts.length;

    const mappedPosts = this.fromPostDBTypeToPostViewModelWithPagination(posts);

    const pagesCount = Math.ceil(totalCount / pageSize);
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
      const post: PostDBType = await this.postsModel
        .findOne({
          _id: new ObjectId(postId),
        })
        .lean();

      const bannedBlogIds = await this.blogsQueryRepository.getBannedBlogsIds();

      if (bannedBlogIds.includes(post.blogId)) {
        throw new NotFoundException();
      }

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

    const totalCount = mappedPosts.length;

    return {
      pagesCount: Math.ceil(totalCount / +pageSize),
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedPosts,
    };
  }

  private mapNewestLikes(likes: LikeDBType[]): NewestLikesType[] {
    return likes.map((like) => ({
      addedAt: like.addedAt,
      userId: like.userId.toString(),
      login: like.userLogin,
    }));
  }

  private async getLikesInfoForPost(post: PostDBType, userId?: string) {
    const bannedUserIds = (await this.usersQueryRepo.findBannedUsers()).map(
      (u) => u._id,
    );
    post.extendedLikesInfo.likesCount = await this.likesModel.countDocuments({
      parentId: post._id,
      status: LikeStatus.Like,
      userId: { $nin: bannedUserIds }, // exclude banned users
    });
    post.extendedLikesInfo.dislikesCount = await this.likesModel.countDocuments(
      {
        parentId: post._id,
        status: LikeStatus.Dislike,
        userId: { $nin: bannedUserIds }, // exclude banned users
      },
    );

    const newestLikes: LikeDBType[] = await this.likesModel
      .find({
        parentId: post._id,
        status: LikeStatus.Like,
        userId: { $nin: bannedUserIds },
      })
      .sort({ addedAt: -1 })
      .limit(3)
      .lean();

    post.extendedLikesInfo.newestLikes = this.mapNewestLikes(newestLikes);

    if (userId) {
      const user = await this.usersQueryRepo.findUserByUserId(userId);

      if (user.banInfo.isBanned === true) {
        post.extendedLikesInfo.myStatus = LikeStatus.None;
      } else {
        const status: LikeDBType = await this.likesModel
          .findOne({
            parentId: new ObjectId(post._id),
            userId: new ObjectId(userId),
          })
          .exec();

        if (status) {
          post.extendedLikesInfo.myStatus = status.status;
        }
      }
    }
    return post;
  }
}
