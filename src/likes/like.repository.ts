import { Injectable, Scope } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LikeInputModel, LikeViewModel, UserViewModel } from '../models/models';
import { Likes } from '../entities/likes.entity';

@Injectable({ scope: Scope.DEFAULT })
export class LikesRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Likes)
    private readonly likeModel: Repository<Likes>,
  ) {
    return;
  }

  async postsUpdateLikeStatus(
    postId: string,
    user: UserViewModel,
    likeStatusDTO: LikeInputModel,
  ): Promise<LikeViewModel> {
    const existingLike = await this.likeModel.find({
      where: [{ postId: postId, userId: user.id }],
    });
    if (existingLike.length > 0) {
      const like = existingLike[0];

      like.status = likeStatusDTO.likeStatus;
      like.addedAt = new Date().toISOString();
      like.login = user.login;

      const updatedLike = await this.likeModel.save(like);

      return updatedLike;
    } else {
      const newLike = Likes.createPostLike(postId, user, likeStatusDTO);

      const createdLike = await this.likeModel.save(newLike);

      return createdLike;
    }
  }
  async commentsUpdateLikeStatus(
    commentId: string,
    user: UserViewModel,
    likeStatusDTO: LikeInputModel,
  ): Promise<LikeViewModel> {
    const existingLike = await this.likeModel.find({
      where: [{ commentId: commentId, userId: user.id }],
    });
    if (existingLike.length) {
      const like = existingLike[0];

      like.status = likeStatusDTO.likeStatus;
      like.addedAt = new Date().toISOString();
      like.login = user.login;

      return await this.likeModel.save(like);
    } else {
      const newLike = Likes.createCommentLike(commentId, user, likeStatusDTO);

      return await this.likeModel.save(newLike);
    }
  }

  async deleteAllLikes() {
    return await this.likeModel.delete({});
  }
}
