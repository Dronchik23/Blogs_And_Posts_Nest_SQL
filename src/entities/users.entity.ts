import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Blogs } from './blogs.entity';
import { Devices } from './devices.entity';
import { UserInputModel } from '../models/models';
import { add } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

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

  @Column({ default: null })
  gameStatus: string;

  @OneToMany(() => Blogs, (b) => b.blogOwner)
  blogs: Blogs[];

  @OneToMany(() => Devices, (d) => d.deviceOwner)
  devices: Devices[];

  static createBySa(dto: UserInputModel, passwordHash: string) {
    const newUser = new Users();
    newUser.login = dto.login;
    newUser.email = dto.email;
    newUser.passwordHash = passwordHash;
    newUser.createdAt = new Date().toISOString();
    newUser.confirmationCode = uuidv4().toString();
    newUser.confirmationExpirationDate = add(new Date(), {
      hours: 2,
      minutes: 3,
    }).toISOString();
    newUser.isEmailConfirmed = true;
    newUser.recoveryCode = null;
    newUser.isRecoveryConfirmed = true;
    newUser.isBanned = false;
    newUser.banReason = null;
    newUser.blogId = null;

    return newUser;
  }

  static create(
    dto: UserInputModel,
    passwordHash: string,
    confirmationCode: string,
  ) {
    const newUser = new Users();
    newUser.login = dto.login;
    newUser.email = dto.email;
    newUser.passwordHash = passwordHash;
    newUser.createdAt = new Date().toISOString();
    newUser.confirmationCode = confirmationCode;
    newUser.confirmationExpirationDate = add(new Date(), {
      hours: 2,
      minutes: 3,
    }).toISOString();
    newUser.isEmailConfirmed = false;
    newUser.recoveryCode = null;
    newUser.isRecoveryConfirmed = false;
    newUser.isBanned = false;
    newUser.banReason = null;
    newUser.blogId = null;

    return newUser;
  }
}
