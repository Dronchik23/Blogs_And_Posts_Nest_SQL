import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Comments } from './comments.entity';
import { Likes } from './likes.entity';
import { BlogPostInputModel, BlogViewModel } from '../models/models';
import { LikeStatus } from '../types/types';

@Entity()
export class Posts {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  shortDescription: string;

  @Column()
  content: string;

  @Column({ type: 'uuid' })
  blogId: string;

  @Column()
  blogName: string;

  @Column()
  createdAt: string;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  dislikesCount: number;

  @Column({ default: LikeStatus.None })
  myStatus: LikeStatus;

  @ManyToOne(() => Posts, (p) => p.postsBlog)
  postsBlog: Posts;

  @OneToMany(() => Comments, (c) => c.commentsPost)
  commentsPost: Posts[];

  @OneToMany(() => Likes, (l) => l.postsLike)
  like: Likes[];

  static create(dto: BlogPostInputModel, blog: BlogViewModel) {
    const newPost = new Posts();
    newPost.title = dto.title;
    newPost.shortDescription = dto.shortDescription;
    newPost.content = dto.content;
    newPost.createdAt = new Date().toISOString();
    newPost.blogId = blog.id;
    newPost.blogName = blog.name;
    newPost.likesCount = 0;
    newPost.dislikesCount = 0;
    newPost.myStatus = LikeStatus.None;
    return newPost;
  }
}
