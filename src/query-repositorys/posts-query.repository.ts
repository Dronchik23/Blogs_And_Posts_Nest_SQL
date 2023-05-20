import {
  LikeStatus,
  NewestLikesType,
  PaginationType,
  PostDBType,
  UserDBType,
} from '../types and models/types';
import { PostViewModel } from '../types and models/models';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersQueryRepository } from './users-query.repository';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Posts } from '../entities/posts.entity';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Posts) private readonly blogModel: Repository<Posts>,
    private readonly usersQueryRepo: UsersQueryRepository,
  ) {}

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
        newestLikes: [],
        /*  newestLikes: post.newestLikes.map((like) => {
          return {
            addedAt: like.addedAt,
            userId: like.userId,
            login: like.login,
          };
        }),*/
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

    const totalCount = await this.dataSource
      .query(
        `
SELECT COUNT(*) FROM posts
WHERE "blogId" NOT IN (SELECT id FROM blogs WHERE "isBanned" = true);
`,
      )
      .then((result) => +result[0].count);

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
      const result = await this.blogModel.findOneBy({
        id: postId,
      });
      if (!result) {
        throw new NotFoundException();
      }

      const post = new PostViewModel(result);

      const postWithLikesInfo = await this.getLikesInfoForPost(post, userId);

      return new PostViewModel(postWithLikesInfo);
    } catch (e) {
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

    const totalCount = await this.dataSource
      .query(
        `
SELECT COUNT(*) FROM posts
WHERE "blogId" = $1;
`,
        [blogId],
      )
      .then((result) => +result[0].count);

    return {
      pagesCount: Math.ceil(totalCount / +pageSize),
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedPosts,
    };
  }

  private async getLikesInfoForPost(post: any, userId?: string) {
    const likesCountResult = await this.dataSource.query(
      `
      SELECT COUNT(*) AS "likesCount" 
      FROM likes 
      WHERE "postId" = $1
      AND status = 'Like' 
      AND "userId" NOT IN (SELECT id FROM users WHERE "isBanned" = true)
    `,
      [post.id],
    );
    post.likesCount = parseInt(likesCountResult[0].likesCount);

    const disLikesCountResult = await this.dataSource.query(
      `
      SELECT COUNT(*) AS "dislikesCount" 
      FROM likes 
      WHERE "postId" = $1
      AND status = 'Dislike' 
      AND "userId" NOT IN (SELECT id FROM users WHERE "isBanned" = true)
    `,
      [post.id],
    );
    post.dislikesCount = parseInt(disLikesCountResult[0].dislikesCount);

    const newestLikes: NewestLikesType[] = await this.dataSource.query(
      `
      SELECT * 
      FROM likes 
      WHERE "postId" = $1
      AND status = 'Like' 
      AND "userId" NOT IN (SELECT id FROM users WHERE "isBanned" = true)
      ORDER BY "addedAt" DESC
      LIMIT 3;
    `,
      [post.id],
    );

    if (userId) {
      debugger;
      const user: UserDBType =
        await this.usersQueryRepo.findUserByUserIdWithDBType(userId);

      if (user[0].isBanned === true) {
        post.myStatus = LikeStatus.None;
      } else {
        const result = await this.dataSource.query(
          `
    SELECT status 
    FROM likes 
    WHERE "postId" = $1 
    AND "userId" = $2
    `,
          [post.id, userId],
        );
        console.log(result);
        if (result.length > 0) {
          if (result[0].status === 'Like') {
            post.myStatus = LikeStatus.Like;
          } else if (result[0].status === 'Dislike') {
            post.myStatus = LikeStatus.Dislike;
          } else {
            post.myStatus = LikeStatus.None;
          }
        } else {
          post.myStatus = LikeStatus.None;
        }
      }
    } else {
      post.myStatus = LikeStatus.None;
    }

    return {
      ...post,
      extendedLikesInfo: {
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount,
        myStatus: post.myStatus,
        newestLikes: newestLikes,
      },
    };
  }
}
