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

@Entity()
export class Comments {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  //@JoinColumn({ name: 'commentatorId' })
  @Column({ type: 'uuid' })
  commentatorId: string;

  @JoinColumn({ name: 'commentatorLogin' })
  commentatorLogin: string;

  @Column()
  createdAt: string;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  dislikesCount: number;

  @Column({ default: 'None' })
  myStatus: string;

  //@JoinColumn({ name: 'postId' })
  @Column({ type: 'uuid' })
  postId: string;

  //@JoinColumn({ name: 'postTitle' })
  @Column()
  postTitle: string;

  //@JoinColumn({ name: 'blogId' })
  @Column({ type: 'uuid' })
  blogId: string;

  @JoinColumn({ name: 'blogName' })
  blogName: string;

  @ManyToOne(() => Posts, (p) => p.commentsPost)
  commentsPost: Posts[];

  @OneToMany(() => Likes, (l) => l.commentsLike)
  like: Likes[];
}
