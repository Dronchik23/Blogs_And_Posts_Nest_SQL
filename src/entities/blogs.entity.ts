import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from './users.entity';
import { BlogInputModel } from '../models/models';
import { Posts } from './posts.entity';

@Entity()
export class Blogs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ collation: 'с' })
  name: string;

  @Column()
  description: string;

  @Column()
  websiteUrl: string;

  @Column()
  createdAt: string;

  @Column()
  isMembership: boolean;

  @Column({ type: 'uuid' })
  blogOwnerId: string;

  @Column()
  blogOwnerLogin: string;

  @Column()
  isBanned: boolean;

  @Column({ default: null })
  banDate: string | null;

  @ManyToOne(() => Users, (u) => u.blogs)
  blogOwner: Users;

  @OneToMany(() => Posts, (p) => p.postsBlog)
  postsBlog: Posts[];

  static create(dto: BlogInputModel, ownerId: string, ownerLogin: string) {
    const newBlog = new Blogs();
    newBlog.name = dto.name;
    newBlog.description = dto.description;
    newBlog.websiteUrl = dto.websiteUrl;
    newBlog.createdAt = new Date().toISOString();
    newBlog.isMembership = false;
    newBlog.blogOwnerId = ownerId;
    newBlog.blogOwnerLogin = ownerLogin;
    newBlog.isBanned = false;
    newBlog.banDate = null;
    return newBlog;
  }
}
