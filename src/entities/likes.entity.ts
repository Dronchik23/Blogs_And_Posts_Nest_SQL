import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Posts } from './posts.entity';
import { Comments } from './comments.entity';
import { LikeStatus } from '../types/types';
import { LikeInputModel, UserViewModel } from '../models/models';

@Entity()
export class Likes {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: LikeStatus.None })
  status: LikeStatus;

  @Column({ nullable: true, type: 'uuid' })
  postId: string;

  @Column({ nullable: true, type: 'uuid' })
  commentId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  login: string;

  @Column()
  addedAt: string;

  @ManyToOne(() => Comments, (c) => c.like)
  commentsLike: Likes[];

  @ManyToOne(() => Posts, (p) => p.like)
  postsLike: Likes[];

  static createPostLike(
    postId: string,
    user: UserViewModel,
    dto: LikeInputModel,
  ) {
    const newLike = new Likes();
    newLike.postId = postId;
    newLike.userId = user.id;
    newLike.login = user.login;
    newLike.status = dto.likeStatus;
    newLike.addedAt = new Date().toISOString();
    return newLike;
  }

  static createCommentLike(
    commentId: string,
    user: UserViewModel,
    dto: LikeInputModel,
  ) {
    const newLike = new Likes();
    newLike.commentId = commentId;
    newLike.userId = user.id;
    newLike.login = user.login;
    newLike.status = dto.likeStatus;
    newLike.addedAt = new Date().toISOString();
    return newLike;
  }
}
