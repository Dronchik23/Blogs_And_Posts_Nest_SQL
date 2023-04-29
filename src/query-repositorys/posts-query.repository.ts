import {
  LikeDBType,
  LikeStatus,
  NewestLikesType,
  PaginationType,
  PostDBType,
  UserDBType,
} from '../types and models/types';
import { PostViewModel } from '../types and models/models';
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

  private fromPostDBTypePostViewModel = (post: PostDBType): PostViewModel => {
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
        newestLikes: post.newestLikes,
      },
    };
  };

  private fromPostDBTypeToPostViewModelWithPagination = (
    posts: PostDBType[],
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
        newestLikes: post.newestLikes,
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
    const posts: PostDBType[] = await this.dataSource.query(
      `
  SELECT * 
  FROM posts 
  WHERE "blogId" NOT IN (SELECT id FROM blogs WHERE "isBanned" = true)
  ORDER BY "${sortBy}" ${sortDirection}
  LIMIT $1
  OFFSET $2;
`,
      [pageSize, (pageNumber - 1) * pageSize],
    );

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
      const post: PostDBType = await this.dataSource.query(
        `SELECT * FROM posts WHERE id = $1 ;`,
        [postId],
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
    const posts: PostDBType[] = await this.dataSource.query(
      `
  SELECT * 
  FROM posts 
  WHERE "blogId" = $1
  ORDER BY "${sortBy}" ${sortDirection}
  LIMIT $2
  OFFSET $3;
`,
      [blogId, pageSize, (pageNumber - 1) * pageSize],
    );

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

  private async getLikesInfoForPost(post: PostDBType, userId?: string) {
    post.likesCount = await this.dataSource.query(
      `
    SELECT COUNT(*) AS likesCount 
    FROM likes 
    WHERE "parentId" = $1
     AND status = 'Like' AND "userId" NOT IN (SELECT id FROM users WHERE "isBanned" = true)
  `,
      [post.id],
    );

    post.dislikesCount = await this.dataSource.query(
      `
    SELECT COUNT(*) AS "dislikesCount" 
    FROM likes 
    WHERE "parentId" = $1
     AND status = 'Dislike' AND "userId" NOT IN (SELECT id FROM users WHERE "isBanned" = true)
  `,
      [post.id],
    );

    const newestLikes: NewestLikesType[] = await this.dataSource.query(
      `
    SELECT * 
    FROM likes 
    WHERE "parentId" = $1
    AND status = 'Like' AND "userId" NOT IN (SELECT id FROM users WHERE "isBanned" = true)`,
      [post.id],
    );

    post.newestLikes = newestLikes;

    if (userId) {
      const user: UserDBType =
        await this.usersQueryRepo.findUserByUserIdWithDBType(userId);

      if (user.isBanned === true) {
        post.myStatus = LikeStatus.None;
      } else {
        const myLike: LikeDBType = await this.dataSource.query(
          `
        SELECT status 
        FROM likes 
        WHERE "parentId" = $1 AND "userId" = $2
      `,
          [post.id, userId],
        );

        if (myLike) {
          post.myStatus = myLike.status;
        }
      }
    }

    return post;
  }
}
