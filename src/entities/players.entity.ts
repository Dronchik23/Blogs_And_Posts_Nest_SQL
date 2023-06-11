import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserViewModel } from '../models/models';
import { GameProgresses } from './game-progresses';

@Entity()
export class Players {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column()
  firstPlayerId: string;

  @Column()
  firstPlayerLogin: string;

  @Column({ nullable: true })
  secondPlayerId: string;

  @Column({ nullable: true })
  secondPlayerLogin: string;

  @Column({ nullable: true })
  gameProgressId: string;

  @OneToOne(() => GameProgresses, (g) => g.players)
  @JoinColumn()
  gameProgress: GameProgresses;

  static create(user: UserViewModel, gameProgressId: string) {
    const newPlayer = new Players();
    newPlayer.firstPlayerId = user.id;
    newPlayer.firstPlayerLogin = user.login;
    newPlayer.secondPlayerId = null;
    newPlayer.secondPlayerLogin = null;
    newPlayer.gameProgressId = gameProgressId;
    return newPlayer;
  }
}
