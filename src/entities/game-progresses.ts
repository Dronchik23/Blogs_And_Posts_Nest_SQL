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

@Entity({ name: 'gameProgresses' })
export class GameProgresses {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ nullable: true })
  firstPlayerScore: number;

  @Column({ nullable: true })
  secondPlayerScore: number;

  @OneToOne(() => Players)
  @JoinColumn()
  players: Players;

  @OneToMany(() => Answers, (a) => a.gameProgress.answers, {
    eager: true,
  })
  answers: Answers[];

  static create(firstPlayerId: string) {
    const gameProgress = new GameProgresses();
    gameProgress.players.firstPlayerId = firstPlayerId;
    gameProgress.firstPlayerScore = 0;
    gameProgress.secondPlayerScore = 0;
    gameProgress.answers = [];
    return gameProgress;
  }
}
