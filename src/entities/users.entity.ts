import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Blogs } from './blogs.entity';
import { Devices } from './devices.entity';

@Entity()
export class Users {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  login: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  createdAt: string;

  @Column()
  confirmationCode: string;

  @Column()
  confirmationExpirationDate: string;

  @Column()
  isEmailConfirmed: boolean;

  @Column({ default: null })
  recoveryCode: string | null;

  @Column()
  isRecoveryConfirmed: boolean;

  @Column()
  isBanned: boolean;

  @Column({ default: null })
  banDate: string;

  @Column({ default: null })
  banReason: string;

  @Column({ default: null })
  blogId: string;

  @OneToMany(() => Blogs, (b) => b.blogOwner)
  blogs: Blogs[];

  // @OneToMany(() => Devices, (d) => d.deviceOwner)
  // devices: Devices[];
}
