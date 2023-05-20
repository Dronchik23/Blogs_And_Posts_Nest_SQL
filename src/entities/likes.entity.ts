import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Posts } from './posts.entity';
import { Comments } from './comments.entity';
import { Users } from './users.entity';
import { LikeStatus } from '../types and models/types';
import {
  CommentInputModel,
  LikeInputModel,
  PostViewModel,
  UserViewModel,
} from '../types and models/models';

@Entity()
export class Likes {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: LikeStatus.None })
  status: LikeStatus;

  @Column({ nullable: true, type: 'uuid' })
  postId: string;

  @Column({ nullable: true })
  commentId: string;

  @JoinColumn({ name: 'userId' })
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
    parentId: string,
    user: UserViewModel,
    dto: LikeInputModel,
  ) {
    const newLike = new Likes();
    newLike.postId = parentId;
    newLike.userId = user.id;
    newLike.login = user.login;
    newLike.status = dto.likeStatus;
    newLike.addedAt = new Date().toISOString();
    return newLike;
  }

  static createCommentLike(
    parentId: string,
    user: UserViewModel,
    dto: LikeInputModel,
  ) {
    const newLike = new Likes();
    newLike.postId = parentId;
    newLike.userId = user.id;
    newLike.login = user.login;
    newLike.status = dto.likeStatus;
    newLike.addedAt = new Date().toISOString();
    return newLike;
  }
}
