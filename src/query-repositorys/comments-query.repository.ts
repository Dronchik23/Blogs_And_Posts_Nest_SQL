import {
  BlogDBType,
  CommentDBType,
  LikeDBType,
  LikeStatus,
  PaginationType,
  PostDBType,
  UserDBType,
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
    comment: CommentDBType,
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
    const comments: CommentDBType[] = await this.dataSource.query(
      `
  SELECT *
FROM comments
WHERE "postId" = $1
ORDER BY "${sortBy}" ${sortDirection}
LIMIT $2
OFFSET $3;
  `,
      [postId, pageSize, (pageNumber - 1) * pageSize],
    );

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
        (user: UserDBType) => user.id,
      );
      const comment: CommentDBType = await this.dataSource.query(
        `SELECT * FROM comments WHERE id = $1, "commentatorId" = $2  AND "commentatorId" NOT IN (SELECT id FROM users WHERE "isBanned" = true);`,
        [commentId, userId, bannedUserIds],
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
    comment: CommentDBType,
    userId?: string,
  ) {
    const bannedUserIds = (await this.usersQueryRepo.findBannedUsers()).map(
      (u) => u.id,
    );

    comment.likesCount = await this.dataSource.query(
      `
        SELECT COUNT(*) FROM likes
    INNER JOIN comments ON likes."parentId" = comments.id
    WHERE likes.status = 'like'
    AND likes."userId" NOT IN ($1:scv)
    AND comments.id = $2`,
      [bannedUserIds, comment.id],
    );

    comment.dislikesCount = await this.dataSource.query(
      `
        SELECT COUNT(*) FROM likes
    INNER JOIN comments ON likes."parentId" = comments.id
    WHERE likes.status = 'Dislike'
    AND likes."userId" NOT IN ($1:scv)
    AND comments.id = $2`,
      [bannedUserIds, comment.id],
    );

    if (userId) {
      const user = await this.usersQueryRepo.findUserByUserId(userId);
      if (user.banInfo.isBanned === true) {
        comment.myStatus = LikeStatus.None;
      } else {
        const status: LikeDBType = await this.dataSource.query(
          `
SELECT * FROM likes
WHERE "parentId" = $1 AND userId = $2
`,
          [comment.id, userId],
        );
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
    const blogs: BlogDBType[] = await this.dataSource.query(
      `
  SELECT * FROM blogs
  WHERE name ILIKE $1, blogOwnerId = $2
  ORDER BY "${sortBy}" ${sortDirection}
  LIMIT $3
  OFFSET $4;
`,
      [searchNameTerm, userId, pageSize, (pageNumber - 1) * pageSize],
    );

    const blogIds: string[] = blogs.map((blog: BlogDBType) => blog.id); // find all blogIds of current user

    const posts: PostDBType[] = await this.dataSource.query(
      `SELECT * FROM posts WHERE blogId IN ($1: scv) ;
 ;`,
      [blogIds],
    );

    const postIds: string[] = posts.map((post: PostDBType) => post.id); // find all postId of current user blogs

    const comments: CommentDBType[] = await this.dataSource.query(
      `
        SELECT * FROM comments
    WHERE postId IN $1
    AND "commentatorId" NOT IN (SELECT id FROM users WHERE "isBanned" = true)
    ORDER BY "${sortBy}" ${sortDirection}
   LIMIT $2
    OFFSET $3
   
`,
      [postIds, pageSize, (pageNumber - 1) * pageSize],
    );

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
