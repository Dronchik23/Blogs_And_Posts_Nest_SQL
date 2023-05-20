import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from './users.entity';
import { Blogs } from './blogs.entity';
import { Posts } from './posts.entity';
import { Likes } from './likes.entity';
import { LikeStatus } from '../types and models/types';
import {
  BlogPostInputModel,
  BlogViewModel,
  CommentInputModel,
  PostViewModel,
  UserViewModel,
} from '../types and models/models';

@Entity()
export class Comments {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  @Column({ type: 'uuid' })
  commentatorId: string;

  @Column()
  commentatorLogin: string;

  @Column()
  createdAt: string;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  dislikesCount: number;

  @Column({ default: 'None' })
  myStatus: LikeStatus;

  @Column({ type: 'uuid' })
  postId: string;

  @Column()
  postTitle: string;

  @Column({ type: 'uuid' })
  blogId: string;

  @Column()
  blogName: string;

  @ManyToOne(() => Posts, (p) => p.commentsPost)
  commentsPost: Posts[];

  @OneToMany(() => Likes, (l) => l.commentsLike)
  like: Likes[];

  static create(
    dto: CommentInputModel,
    user: UserViewModel,
    post: PostViewModel,
  ) {
    const newComment = new Comments();
    newComment.content = dto.content;
    newComment.commentatorId = user.id;
    newComment.commentatorLogin = user.login;
    newComment.blogId = post.blogId;
    newComment.blogName = post.blogName;
    newComment.postId = post.id;
    newComment.postTitle = post.title;
    newComment.createdAt = new Date().toISOString();
    return newComment;
  }
}
