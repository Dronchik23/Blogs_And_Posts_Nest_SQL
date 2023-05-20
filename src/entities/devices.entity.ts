import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from './users.entity';

@Entity()
export class Devices {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ip: string;

  @Column({ type: 'uuid' })
  deviceId: string;

  @Column()
  title: string;

  @Column()
  lastActiveDate: string;

  @Column({ type: 'uuid' })
  userId: string;

  // @ManyToOne(() => Users, (u) => u.devices)
  // deviceOwner: Users;
}
