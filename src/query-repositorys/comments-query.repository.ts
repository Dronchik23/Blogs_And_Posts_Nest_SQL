import {
  BlogSQLDBType,
  CommentSQLDBType,
  LikeDBType,
  LikeStatus,
  PaginationType,
  PostSQLDBType,
  UserSQLDBType,
} from '../types and models/types';
import {
  BloggerCommentViewModel,
  CommentViewModel,
} from '../types and models/models';
import { UsersQueryRepository } from './users-query.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    private readonly usersQueryRepo: UsersQueryRepository,
  ) {}

  private fromCommentDBTypeToCommentViewModel = (
    comment: CommentSQLDBType,
  ): CommentViewModel => {
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
  };

  private fromCommentDBTypeToBloggerCommentViewModelWithPagination = (
    comment: CommentSQLDBType[],
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
    comment: CommentSQLDBType[],
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
    const comments: CommentSQLDBType[] = await await this.dataSource.query(`
  SELECT *
FROM blogs
ORDER BY ${sortBy} ${sortDirection}
LIMIT ${pageSize}
OFFSET ${(pageNumber - 1) * pageSize};
  `);

    const commentsWithLikesInfo = await Promise.all(
      comments.map(async (comment) => {
        return this.getLikesInfoForComment(comment, userId);
      }),
    );

    const mappedComments = this.fromCommentDBTypeCommentViewModelWithPagination(
      commentsWithLikesInfo,
    );

    const totalCount = mappedComments.length;

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
        (user: UserSQLDBType) => user.id,
      );
      const comment: CommentSQLDBType = await this.dataSource.query(
        `SELECT * FROM comments WHERE id = '${commentId}', commentatorId = '${userId}'  AND commentatorId NOT IN (${bannedUserIds
          .map((id) => `${id}`)
          .join(',')}) ;`,
      );

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
    comment: CommentSQLDBType,
    userId?: string,
  ) {
    const bannedUserIds = (await this.usersQueryRepo.findBannedUsers()).map(
      (u) => u.id,
    );

    comment.likesCount = await this.dataSource.query(`
        SELECT COUNT(*) FROM likes
    INNER JOIN comments ON likes.parentId = comments.id
    WHERE likes.status = 'like'
    AND likes.userId NOT IN (SELECT id FROM users WHERE isBanned = true)
    AND comments.id = '${comment.id}';`);

    comment.dislikesCount = await this.dataSource.query(`
        SELECT COUNT(*) FROM likes
    INNER JOIN comments ON likes.parentId = comments.id
    WHERE likes.status = 'Dislike'
    AND likes.userId NOT IN (SELECT id FROM users WHERE isBanned = true)
    AND comments.id = '${comment.id}';`);

    if (userId) {
      const user = await this.usersQueryRepo.findUserByUserId(userId);
      if (user.banInfo.isBanned === true) {
        comment.myStatus = LikeStatus.None;
      } else {
        const status: LikeDBType = await this.dataSource.query(`
SELECT * FROM likes
WHERE parentId = '<comment.parentId>' AND userId = '<userId>'
LIMIT 1;
`);
        if (status) {
          comment.myStatus = status.status;
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
    const bannedUserIds = (await this.usersQueryRepo.findBannedUsers()).map(
      (user: UserSQLDBType) => user.id,
    );

    const blogs: BlogSQLDBType[] = await await this.dataSource.query(`
  SELECT * FROM blogs
  WHERE name ILIKE '%${searchNameTerm ?? ''}%', blogOwnerId = ${userId}
  ORDER BY ${sortBy} ${sortDirection}
  LIMIT ${pageSize}
  OFFSET ${(pageNumber - 1) * pageSize};
`);

    const blogIds: string[] = blogs.map((blog: BlogSQLDBType) => blog.id); // find all blogIds of current user

    const posts: PostSQLDBType[] = await this.dataSource.query(
      `SELECT * FROM posts WHERE blogId IN ('${blogIds.join("','")}') ;
 ;`,
    );

    const postIds: string[] = posts.map((post: PostSQLDBType) => post.id); // find all postId of current user blogs

    const comments: CommentSQLDBType[] = await this.dataSource.query(`
        SELECT * FROM comments
    WHERE postId IN (${postIds.map((id) => `'${id}'`).join(', ')}) 
    AND commentatorUserId NOT IN (${bannedUserIds
      .map((id) => `'${id}'`)
      .join(', ')})
    ORDER BY ${sortBy} ${sortDirection === 'asc' ? 'ASC' : 'DESC'}
    OFFSET ${(pageNumber - 1) * pageSize}
    LIMIT ${pageSize};
`);

    const commentsWithLikesInfo = await Promise.all(
      comments.map(async (comment) => {
        return this.getLikesInfoForComment(comment, userId);
      }),
    );

    const mappedComments =
      this.fromCommentDBTypeToBloggerCommentViewModelWithPagination(
        commentsWithLikesInfo,
      );

    const totalCount = mappedComments.length;

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
