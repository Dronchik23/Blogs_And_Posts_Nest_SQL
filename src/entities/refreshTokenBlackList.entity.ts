import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'refreshTokenBlackList' })
export class refreshTokenBlackList {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  refreshToken: string;
}
