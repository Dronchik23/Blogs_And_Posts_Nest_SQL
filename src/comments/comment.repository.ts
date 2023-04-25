import { CommentSQLDBType } from '../types and models/types';
import { CommentViewModel } from '../types and models/models';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CommentsRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {
    return;
  }

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
      createdAt: comment.createdAt.toString(),
      likesInfo: {
        likesCount: comment.likesCount,
        dislikesCount: comment.dislikesCount,
        myStatus: comment.myStatus,
      },
    };
  };

  async createComment(
    content: string,
    userId: string,
    login: string,
    createdAt: string,
    postId: string,
    title: string,
    blogId: string,
    blogName: string,
  ): Promise<CommentViewModel> {
    const query = `
   INSERT INTO public.comments(
  content,
  "commentOwnerId",
  "commentOwnerLogin",
  "createdAt",
  "postId",
  "postTitle",
  "blogId",
  "blogName"
) 
VALUES (
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  $7,
  $8
) 
RETURNING *
  `;
    const values = [
      content,
      userId,
      login,
      createdAt,
      postId,
      title,
      blogId,
      blogName,
    ];

    const comment = await this.dataSource.query(query, values);

    return this.fromCommentDBTypeToCommentViewModel(comment[0]); // mapping comment
  }

  async updateCommentByCommentIdAndUserId(
    commentId: string,
    content: string,
    userId: string,
  ) {
    const result = await this.dataSource.query(
      `UPDATE comments SET content = ${content}, WHERE id = ${commentId}, commentOwnerId = ${userId};`,
    );
    return result.affectedRows > 0;
  }

  async deleteCommentByCommentIdAndUserId(commentId: string, userId: string) {
    return await this.dataSource.query(
      `DELETE FROM comments WHERE id = ${commentId}, commentOwnerId = ${userId} ;`,
    );
  }

  async deleteAllComments() {
    return await this.dataSource.query(`DELETE FROM comments;`);
  }
}
