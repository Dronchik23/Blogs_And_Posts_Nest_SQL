import {
  CommentInputModel,
  CommentViewModel,
  PostViewModel,
  UserViewModel,
} from '../models/models';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comments } from '../entities/comments.entity';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectRepository(Comments)
    private readonly commentModel: Repository<Comments>,
  ) {}

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
    commentInputDTO: CommentInputModel,
    userId: string,
  ) {
    const result = await this.commentModel.update(
      { id: commentId, commentatorId: userId },
      {
        content: commentInputDTO.content,
      },
    );
    return result.affected > 0;
  }

  async deleteCommentByCommentIdAndUserId(commentId: string, userId: string) {
    const result = await this.commentModel.delete({
      id: commentId,
      commentatorId: userId,
    });

    return result.affected > 0;
  }

  async deleteAllComments() {
    return await this.commentModel.delete({});
  }
}
