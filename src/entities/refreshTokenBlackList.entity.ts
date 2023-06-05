import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'refreshTokenBlackList' })
export class RefreshTokenBlackList {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  refreshToken: string;
}
