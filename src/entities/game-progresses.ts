import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Answers } from './answers';
import { Players } from './players.entity';
import { UserViewModel } from '../models/models';
import { Games } from './games.entity';

@Entity({ name: 'gameProgresses' })
export class GameProgresses {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ nullable: true })
  firstPlayerScore: number;

  @Column({ nullable: true })
  secondPlayerScore: number;

  @Column({ nullable: true, type: 'uuid' })
  gameId: string;

  @OneToOne(() => Games, (g) => g.gameProgress)
  @JoinColumn()
  game: Games;

  @OneToOne(() => Players, (p) => p.gameProgress, { eager: true })
  players: Players;

  @OneToMany(() => Answers, (a) => a.gameProgress, { eager: true })
  answers: Answers[];

  static create() {
    const newGameProgress = new GameProgresses();
    newGameProgress.firstPlayerScore = 0;
    newGameProgress.secondPlayerScore = 0;
    return newGameProgress;
  }
}
