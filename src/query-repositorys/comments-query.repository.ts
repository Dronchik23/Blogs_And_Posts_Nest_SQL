import {
  BlogDBType,
  CommentDBType,
  LikeStatus,
  NewestLikesType,
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

    const totalCount = await this.dataSource
      .query(
        `
SELECT COUNT(*) FROM comments
WHERE "postId" = $1;
`,
        [postId],
      )
      .then((result) => +result[0].count);

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
      debugger;
      const result: CommentDBType = await this.dataSource.query(
        `SELECT * FROM comments WHERE id = $1 AND "commentatorId" NOT IN (SELECT id FROM users WHERE "isBanned" = true);`,
        [commentId],
      );
      console.log('commentik', result);
      const commentWithLikesInfo = await this.getLikesInfoForComment(
        result[0],
        userId,
      );
      console.log('commentWithLikesInfo', commentWithLikesInfo);
      return this.fromCommentDBTypeToCommentViewModel(commentWithLikesInfo);
    } catch (error) {
      throw new NotFoundException();
    }
  }

  private async getLikesInfoForComment(
    comment: CommentDBType,
    userId?: string,
  ) {
    const likesCountResult = await this.dataSource.query(
      `
    SELECT COUNT(*) AS "likesCount" 
    FROM likes 
    WHERE "parentId" = $1
     AND status = 'Like' AND "userId" NOT IN (SELECT id FROM users WHERE "isBanned" = true)
  `,
      [comment.id],
    );
    comment.likesCount = parseInt(likesCountResult[0].likesCount);

    const disLikesCountResult = await this.dataSource.query(
      `
    SELECT COUNT(*) AS "dislikesCount" 
    FROM likes 
    WHERE "parentId" = $1
     AND status = 'Dislike' AND "userId" NOT IN (SELECT id FROM users WHERE "isBanned" = true)
  `,
      [comment.id],
    );

    comment.dislikesCount = parseInt(disLikesCountResult[0].dislikesCount);

    const newestLikes: NewestLikesType[] = await this.dataSource.query(
      `
    SELECT * 
    FROM likes 
    WHERE "parentId" = $1
    AND status = 'Like' AND "userId" NOT IN (SELECT id FROM users WHERE "isBanned" = true)`,
      [comment.id],
    );

    if (userId) {
      const user: UserDBType[] =
        await this.usersQueryRepo.findUserByUserIdWithDBType(userId);

      if (user[0].isBanned === true) {
        comment.myStatus = LikeStatus.None;
      } else {
        const result = await this.dataSource.query(
          `
    SELECT status 
    FROM likes 
    WHERE "parentId" = $1 
    AND "userId" = $2
    `,
          [comment.id, userId],
        );
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
  WHERE (LOWER(name) LIKE $1 OR $1 IS NULL) AND "blogOwnerId" = $2
  ORDER BY "${sortBy}" ${sortDirection}
  LIMIT $3
  OFFSET $4;
`,
      [searchNameTerm, userId, pageSize, (pageNumber - 1) * pageSize],
    );

    //const blogIds: string[] = blogs.map((blog: BlogDBType) => blog.id); // find all blogIds of current user

    const posts: PostDBType[] = await this.dataSource.query(
      `SELECT * FROM posts WHERE "blogId" NOT IN (SELECT id FROM blogs WHERE "isBanned" = true)
 ;`,
    );

    const postIds: string[] = posts.map((post: PostDBType) => post.id); // find all postId of current user blogs

    const comments: CommentDBType[] = await this.dataSource.query(
      `
        SELECT * FROM comments
        WHERE "postId" IN (${postIds.map((id) => `'${id}'`).join(', ')})
        AND "commentatorId" NOT IN (SELECT id FROM users WHERE "isBanned" = true)
        ORDER BY "${sortBy}" ${sortDirection}
        LIMIT $1
        OFFSET $2
    `,
      [pageSize, (pageNumber - 1) * pageSize],
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
