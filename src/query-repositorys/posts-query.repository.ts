import {
  LikeSQLDBType,
  LikeStatus,
  PaginationType,
  PostSQLDBType,
  UserSQLDBType,
} from '../types and models/types';
import { PostViewModel, UserViewModel } from '../types and models/models';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersQueryRepository } from './users-query.repository';
import { BlogsQueryRepository } from './blogs-query.repository';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    private readonly usersQueryRepo: UsersQueryRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository,
  ) {}

  private fromPostDBTypePostViewModel = (
    post: PostSQLDBType,
  ): PostViewModel => {
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount,
        myStatus: post.myStatus,
        newestLikes: [
          {
            addedAt: post.newestLikesAddedAt,
            userId: post.newestLikesUserId,
            login: post.newestLikesLogin,
          },
        ],
      },
    };
  };

  private fromPostDBTypeToPostViewModelWithPagination = (
    posts: PostSQLDBType[],
  ): PostViewModel[] => {
    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount,
        myStatus: post.myStatus,
        newestLikes: [
          {
            addedAt: post.newestLikesAddedAt,
            userId: post.newestLikesUserId,
            login: post.newestLikesLogin,
          },
        ],
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

    const posts: PostSQLDBType[] = await this.dataSource.query(`
  SELECT * 
  FROM posts 
  WHERE blogId NOT IN (${bannedBlogIds.map((id) => `'${id}'`).join(',')})
  ORDER BY ${sortBy} ${sortDirection === 'asc' ? 'ASC' : 'DESC'}
  LIMIT ${pageSize} OFFSET ${(pageNumber - 1) * pageSize};
`);

    for (const post of posts) {
      await this.getLikesInfoForPost(post, userId);
    }

    const totalCount = posts.length;

    const mappedPosts = this.fromPostDBTypeToPostViewModelWithPagination(posts);

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount,
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
      const post: PostSQLDBType = await this.dataSource.query(
        `SELECT * FROM posts WHERE id = ${postId};`,
      );

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
    const posts: PostSQLDBType[] = await this.dataSource.query(`
  SELECT * 
  FROM posts 
  WHERE blogId = '${blogId}'
  ORDER BY ${sortBy} ${sortDirection === 'asc' ? 'ASC' : 'DESC'}
  LIMIT ${pageSize} OFFSET ${(pageNumber - 1) * pageSize};
`);

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

  private async getLikesInfoForPost(post: PostSQLDBType, userId?: string) {
    const bannedUserIds = (await this.usersQueryRepo.findBannedUsers()).map(
      (u) => u.id,
    );

    post.likesCount = await this.dataSource.query(`
    SELECT COUNT(*) AS likesCount 
    FROM likes 
    WHERE parentId = '${
      post.id
    }' AND status = 'Like' AND user_id NOT IN (${bannedUserIds.join(', ')})
  `);

    post.dislikesCount = await this.dataSource.query(`
    SELECT COUNT(*) AS dislikesCount 
    FROM likes 
    WHERE parentId = '${
      post.id
    }' AND status = 'Dislike' AND user_id NOT IN (${bannedUserIds.join(', ')})
  `);

    const newestLikes: LikeSQLDBType[] = await this.dataSource.query(`
    SELECT * 
    FROM likes 
    WHERE parentId = '${
      post.id
    }' AND status = 'Like' AND userId NOT IN (${bannedUserIds.join(', ')})
    ORDER BY added_at DESC
    LIMIT 3
  `);

    // post.newestLikesAddedAt = newestLikes.map((like) => like.addedAt);
    // post.newestLikesUserId = newestLikes.map((like) => like.userId);
    // post.newestLikesLogin = newestLikes.map((like) => like.login);

    if (userId) {
      const user: UserSQLDBType =
        await this.usersQueryRepo.findUserByUserIdWithDBType(userId);

      if (user.isBanned === true) {
        post.myStatus = LikeStatus.None;
      } else {
        const myLike: LikeSQLDBType = await this.dataSource.query(`
        SELECT status 
        FROM likes 
        WHERE parentId = '${post.id}' AND userId = '${userId}'
      `);

        if (myLike) {
          post.myStatus = myLike.status;
        }
      }
    }

    return post;
  }
}
