import {
  BlogDBType,
  CommentDBType,
  LikeStatus,
  PaginationType,
  PostDBType,
  SortDirection,
  UserDBType,
} from '../types/types';
import { BloggerCommentViewModel, CommentViewModel } from '../models/models';
import { UsersQueryRepository } from './users-query.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Comments } from '../entities/comments.entity';
import { Likes } from '../entities/likes.entity';
import { Users } from '../entities/users.entity';
import { Blogs } from '../entities/blogs.entity';
import { Posts } from '../entities/posts.entity';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Comments)
    private readonly commentModel: Repository<Comments>,
    private readonly usersQueryRepo: UsersQueryRepository,
  ) {}

  private fromCommentDBTypeToBloggerCommentViewModel(
    comment: CommentDBType,
  ): CommentViewModel {
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentatorId,
        userLogin: comment.commentatorLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: comment.likesCount,
        dislikesCount: comment.dislikesCount,
        myStatus: comment.myStatus,
      },
    };
  }

  private fromCommentDBTypeToBloggerCommentViewModelWithPagination = (
    comment: CommentDBType[],
  ): BloggerCommentViewModel[] => {
    return comment.map((comment) => ({
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentatorId,
        userLogin: comment.commentatorLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: comment.likesCount,
        dislikesCount: comment.dislikesCount,
        myStatus: comment.myStatus,
      },
      postInfo: {
        id: comment.postId,
        title: comment.postTitle,
        blogId: comment.blogId,
        blogName: comment.blogName,
      },
    }));
  };

  private fromCommentDBTypeCommentViewModelWithPagination = (
    comment: CommentDBType[],
  ): CommentViewModel[] => {
    return comment.map((comment) => ({
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentatorId,
        userLogin: comment.commentatorLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: comment.likesCount,
        dislikesCount: comment.dislikesCount,
        myStatus: comment.myStatus,
      },
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
    const queryBuilder = await this.dataSource
      .createQueryBuilder()
      .select('*')
      .from(Comments, 'comments')
      .where('comments."postId" = :postId', { postId })
      .andWhere(
        '"userId" NOT IN (SELECT id FROM users WHERE "isBanned" = true)',
      )
      .orderBy(`posts.${sortBy}`, sortDirection.toUpperCase() as SortDirection)
      .take(pageSize)
      .skip((pageNumber - 1) * pageSize);

    const totalCount = await queryBuilder.getCount();

    const comments: CommentDBType[] = await queryBuilder.getMany();

    const commentsWithLikesInfo = await Promise.all(
      comments.map(async (comment) => {
        return this.getLikesInfoForComment(comment, userId);
      }),
    );

    const mappedComments: CommentViewModel[] =
      this.fromCommentDBTypeCommentViewModelWithPagination(
        commentsWithLikesInfo,
      );

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
      const result: CommentDBType = await this.commentModel
        .createQueryBuilder('comments')
        .where('comments.id = :commentId', { commentId })
        .andWhere(
          '"commentatorId" NOT IN (SELECT id FROM users WHERE "isBanned" = true)',
        )
        .getOne();

      const comment = new CommentDBType(
        result.id,
        result.content,
        result.commentatorId,
        result.commentatorLogin,
        result.createdAt,
        result.likesCount,
        result.dislikesCount,
        result.myStatus,
        result.postId,
        result.postTitle,
        result.blogId,
        result.blogName,
      );

      const commentWithLikeInfo = await this.getLikesInfoForComment(
        comment,
        userId,
      );

      return this.fromCommentDBTypeToBloggerCommentViewModel(
        commentWithLikeInfo,
      );
    } catch (error) {
      throw new NotFoundException();
    }
  }

  private async getLikesInfoForComment(
    comment: CommentDBType,
    userId?: string,
  ) {
    const likesCountResult = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'likesCount')
      .from(Likes, 'likes')
      .where('likes."commentId" = :commentId', { commentId: comment.id })
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

    comment.likesCount = +likesCountResult.likesCount;

    const dislikesCountResult = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'dislikesCount')
      .from(Likes, 'likes')
      .where('likes."commentId" = :commentId', { commentId: comment.id })
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

    comment.dislikesCount = +dislikesCountResult.dislikesCount;

    if (userId) {
      const user: UserDBType =
        await this.usersQueryRepo.findUserByUserIdWithDBType(userId);

      if (user.isBanned === true) {
        comment.myStatus = LikeStatus.None;
      } else {
        const result = await this.dataSource
          .createQueryBuilder()
          .select('likes.status', 'status')
          .from(Likes, 'likes')
          .where('"commentId" = :commentId')
          .andWhere('"userId" = :userId')
          .setParameter('commentId', comment.id)
          .setParameter('userId', userId)
          .execute();

        if (result.length > 0) {
          if (result[0].status === 'Like') {
            comment.myStatus = LikeStatus.Like;
          } else if (result[0].status === 'Dislike') {
            comment.myStatus = LikeStatus.Dislike;
          } else {
            comment.myStatus = LikeStatus.None;
          }
        } else {
          comment.myStatus = LikeStatus.None;
        }
      }
    } else {
      comment.myStatus = LikeStatus.None;
    }

    return {
      ...comment,
      likesInfo: {
        likesCount: comment.likesCount,
        dislikesCount: comment.dislikesCount,
        myStatus: comment.myStatus,
      },
    };
  }

  async findAllCommentsForBlogOwner(
    pageSize: number,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
    userId: string,
  ): Promise<PaginationType> {
    debugger;
    const blogs: BlogDBType[] = await this.dataSource
      .createQueryBuilder()
      .select('*')
      .from(Blogs, 'blogs')
      .where('blogs."blogOwnerId" = :userId', { userId })
      .execute();

    const blogIds = blogs.map((blog) => blog.id); // find all blogIds of current user

    const posts = await this.dataSource
      .createQueryBuilder()
      .select('*')
      .from(Posts, 'posts')
      .where(`"blogId" = ANY(:blogIds)`, { blogIds: blogIds })
      .execute();

    const postIds: string[] = posts.map((post: PostDBType) => post.id); // find all postIds of current user

    const builder = await this.dataSource
      .createQueryBuilder()
      .select('*')
      .from(Comments, 'comments')
      .where(`"postId" = ANY(:postIds)`, { postIds: postIds })
      .andWhere(
        `"commentatorId" NOT IN (SELECT id FROM users WHERE "isBanned" = true)`,
      )
      .orderBy(
        `comments.${sortBy}`,
        sortDirection.toUpperCase() as SortDirection,
      )
      .take(pageSize)
      .skip((pageNumber - 1) * pageSize);

    const totalCount = await builder.getCount();

    const comments: CommentDBType[] = await builder.execute();
    const commentsWithLikesInfo = await Promise.all(
      comments.map(async (comment) => {
        return this.getLikesInfoForComment(comment, userId);
      }),
    );

    const mappedComments =
      this.fromCommentDBTypeToBloggerCommentViewModelWithPagination(
        commentsWithLikesInfo,
      );

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
