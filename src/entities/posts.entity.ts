import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Blogs } from './blogs.entity';
import { Users } from './users.entity';
import { Comments } from './comments.entity';
import { Likes } from './likes.entity';

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
  @JoinColumn({ name: 'blogId' })
  blogId: string;

  @Column({ type: 'uuid' })
  @JoinColumn({ name: 'blogName' })
  blogName: string;

  @Column()
  createdAt: string;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  dislikesCount: number;

  @Column({ default: 'None' })
  myStatus: string;

  @ManyToOne(() => Posts, (p) => p.postsBlog)
  postsBlog: Posts;

  @OneToMany(() => Comments, (c) => c.commentsPost)
  commentsPost: Posts[];

  @OneToMany(() => Likes, (l) => l.postsLike)
  like: Likes[];
}
