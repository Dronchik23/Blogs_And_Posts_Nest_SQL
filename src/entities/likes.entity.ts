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

@Entity()
export class Likes {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, type: 'uuid' })
  //@JoinColumn({ name: 'postId' })
  postId: string;

  //@JoinColumn({ name: 'commentId' })
  @Column({ nullable: true })
  commentId: string;

  @JoinColumn({ name: 'userId' })
  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  addedAt: string;

  @ManyToOne(() => Comments, (c) => c.like)
  commentsLike: Likes[];

  @ManyToOne(() => Posts, (p) => p.like)
  postsLike: Likes[];
}
