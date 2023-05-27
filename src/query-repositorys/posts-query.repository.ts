import {
  LikeDBType,
  LikeStatus,
  PaginationType,
  PostDBType,
  SortDirection,
  UserDBType,
} from '../types/types';
import { PostViewModel } from '../models/models';
import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { UsersQueryRepository } from './users-query.repository';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Posts } from '../entities/posts.entity';
import { Likes } from '../entities/likes.entity';
import { Users } from '../entities/users.entity';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Posts) private readonly postModel: Repository<Posts>,
    @InjectRepository(Likes) private readonly likeModel: Repository<Likes>,
    private readonly usersQueryRepo: UsersQueryRepository,
  ) {}

  private fromPostDBTypeToPostViewModelWithPagination = (
    posts: PostDBType[],
  ): PostViewModel[] => {
    debugger;
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
        newestLikes: post.extendedLikesInfo?.newestLikes ?? [],
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
    const queryBuilder = await this.postModel
      .createQueryBuilder('posts')
      .where(
        'posts."blogId" NOT IN (SELECT id FROM blogs WHERE "isBanned" = true)',
      )
      .orderBy(`posts.${sortBy}`, sortDirection.toUpperCase() as SortDirection)
      .take(pageSize)
      .skip((pageNumber - 1) * pageSize);

    const totalCount = await queryBuilder.getCount();

    const posts: PostDBType[] = await queryBuilder.getMany();

    for (const post of posts) {
      await this.getLikesInfoForPost(post, userId);
    }

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
      const result = await this.postModel
        .createQueryBuilder('posts')
        .where('posts.id = :postId', { postId })
        .andWhere(
          '"blogId" NOT IN (SELECT id FROM blogs WHERE "isBanned" = true)',
        )
        .getOne();

      if (!result) {
        throw new NotFoundException();
      }

      const post = new PostViewModel(result);

      const a = await this.getLikesInfoForPost(post, userId);
      return a;

      //return new PostViewModel(postWithLikesInfo);
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
    const builder = await this.postModel
      .createQueryBuilder('posts')
      .where('posts."blogId" = :blogId', { blogId })
      .orderBy(`posts.${sortBy}`, sortDirection.toUpperCase() as SortDirection)
      .take(pageSize)
      .skip((pageNumber - 1) * pageSize);

    const totalCount = await builder.getCount();

    const posts = await builder.getMany();
    debugger;
    for (const post of posts) {
      await this.getLikesInfoForPost(post, userId);
    }
    console.log(posts, 'posts');
    const mappedPosts: PostViewModel[] =
      this.fromPostDBTypeToPostViewModelWithPagination(posts);

    return {
      pagesCount: Math.ceil(totalCount / +pageSize),
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedPosts,
    };
  }

  private async getLikesInfoForPost(post: any, userId?: string) {
    const likesCountResult = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'likesCount')
      .from(Likes, 'likes')
      .where('likes."postId" = :postId', { postId: post.id })
      .andWhere('likes.status = :status', { status: 'Like' })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('id')
          .from(Users, 'users')
          .where('"isBanned" = true')
          .getQuery();
        return `"userId" NOT IN ${subQuery}`;
      })
      .getRawOne();

    post.likesCount = +likesCountResult.likesCount;

    const dislikesCountResult = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'dislikesCount')
      .from(Likes, 'likes')
      .where('likes."postId" = :postId', { postId: post.id })
      .andWhere('likes.status = :status', { status: 'Dislike' })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('id')
          .from(Users, 'users')
          .where('"isBanned" = true')
          .getQuery();
        return `"userId" NOT IN ${subQuery}`;
      })
      .getRawOne();

    post.dislikesCount = +dislikesCountResult.dislikesCount;

    const newestLikes: LikeDBType[] = await this.likeModel
      .createQueryBuilder('likes')
      .where('likes."postId" = :postId', { postId: post.id })
      .andWhere('likes.status = :status', { status: LikeStatus.Like })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('id')
          .from(Users, 'users')
          .where('users."isBanned" = true')
          .getQuery();
        return `"userId" NOT IN ${subQuery}`;
      })
      .orderBy('likes."addedAt"', 'DESC')
      .limit(3)
      .getMany();

    post.myStatus = LikeStatus.None; // default status

    if (userId) {
      const user: UserDBType =
        await this.usersQueryRepo.findUserByUserIdWithDBType(userId);

      if (user.isBanned === true) {
        post.myStatus = LikeStatus.None;
      } else {
        const result: LikeDBType[] = await this.dataSource
          .createQueryBuilder()
          .select('likes.status', 'status')
          .from(Likes, 'likes')
          .where('"postId" = :postId')
          .andWhere('"userId" = :userId')
          .setParameter('postId', post.id)
          .setParameter('userId', userId)
          .execute();

        if (result.length > 0) {
          switch (result[0].status) {
            case 'Like':
              post.myStatus = LikeStatus.Like;
              break;
            case 'Dislike':
              post.myStatus = LikeStatus.Dislike;
              break;
          }
        } else {
          post.myStatus = LikeStatus.None;
        }
      }
    }

    return {
      ...post,
      extendedLikesInfo: {
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount,
        myStatus: post.myStatus,
        newestLikes: newestLikes || [],
      },
    };
  }
}
