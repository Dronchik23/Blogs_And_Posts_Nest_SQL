import { CommentDBType } from '../types and models/types';
import {
  CommentInputModel,
  CommentViewModel,
  PostViewModel,
  UserViewModel,
} from '../types and models/models';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Posts } from '../entities/posts.entity';
import { Comments } from '../entities/comments.entity';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Comments)
    private readonly commentModel: Repository<Comments>,
  ) {
    return;
  }

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
      createdAt: comment.createdAt.toString(),
      likesInfo: {
        likesCount: comment.likesCount,
        dislikesCount: comment.dislikesCount,
        myStatus: comment.myStatus,
      },
    };
  };

  async createComment(
    commentCreateDTO: CommentInputModel,
    user: UserViewModel,
    post: PostViewModel,
  ): Promise<CommentViewModel> {
    const newComment = Comments.create(commentCreateDTO, user, post);
    const createdComment = await this.commentModel.save(newComment);
    return new CommentViewModel(createdComment);
  }

  async updateCommentByCommentIdAndUserId(
    commentId: string,
    content: string,
    userId: string,
  ) {
    const result = await this.dataSource.query(
      `UPDATE comments SET content = $1 WHERE id = $2 AND "commentatorId" = $3;
`,
      [content, commentId, userId],
    );
    return result[1];
  }

  async deleteCommentByCommentIdAndUserId(commentId: string, userId: string) {
    const result = await this.dataSource.query(
      `DELETE FROM comments WHERE id = $1 AND "commentatorId" = $2 ;`,
      [commentId, userId],
    );
    return result[1];
  }

  async deleteAllComments() {
    return await this.dataSource.query(`DELETE FROM comments CASCADE;`);
  }
}
