import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GameStatuses } from '../types/types';
import { Questions } from './questions.entity';
import { GameProgresses } from './game-progresses';
import { Players } from './players.entity';

@Entity()
export class Games {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: GameStatuses.PendingSecondPlayer, enum: GameStatuses })
  status: GameStatuses;

  @Column()
  pairCreatedDate: string;

  @Column({ nullable: true })
  startGameDate: string;

  @Column({ nullable: true })
  finishGameDate: string;

  @Column({ nullable: true, type: 'uuid' })
  gameProgressId: string;

  @OneToOne(() => GameProgresses, (g) => g.game, { eager: true })
  gameProgress: GameProgresses;

  @OneToMany(() => Questions, (q) => q.game, { eager: true })
  questions: Questions[];

  static create(
    gameProgressId: string,
    players: Players,
    //answers: Answers,
    startGameDate?: string | null,
  ) {
    const newGame = new Games();
    newGame.pairCreatedDate = new Date().toISOString();
    newGame.startGameDate = startGameDate;
    newGame.finishGameDate = null;
    newGame.status = GameStatuses.PendingSecondPlayer;
    newGame.gameProgressId = gameProgressId;
    return newGame;
  }
}
