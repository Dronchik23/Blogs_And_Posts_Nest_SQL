import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
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

  @ManyToOne(() => Users, (u) => u.devices)
  deviceOwner: Users;

  static create(
    ip: string,
    title: string,
    lastActiveDate: string,
    deviceId: string,
    userId: string,
  ) {
    const newDevice = new Devices();
    newDevice.ip = ip;
    newDevice.title = title;
    newDevice.lastActiveDate = lastActiveDate;
    newDevice.deviceId = deviceId;
    newDevice.userId = userId;
    return newDevice;
  }
}
