import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GameStatuses } from '../types/types';
import { Questions } from './questions.entity';
import { FirstPlayerAnswers } from './firstPlayerAnswers';
import { SecondPlayerAnswers } from './secondPlayerAnswers';
import { UserViewModel } from '../models/models';

@Entity()
export class Games {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: GameStatuses.PendingSecondPlayer, enum: GameStatuses })
  status: GameStatuses;

  @Column({ nullable: true })
  firstPlayerScore: number;

  @Column({ nullable: true })
  secondPlayerScore: number;

  @Column({ nullable: true, type: 'uuid' })
  firstPlayerId: string;

  @Column({ nullable: true })
  firstPlayerLogin: string;

  @Column({ nullable: true, type: 'uuid' })
  secondPlayerId: string;

  @Column({ nullable: true })
  secondPlayerLogin: string;

  @Column()
  pairCreatedDate: string;

  @Column({ nullable: true })
  startGameDate: string;

  @Column({ nullable: true })
  finishGameDate: string;

  @OneToMany(() => FirstPlayerAnswers, (a) => a.game, { eager: true })
  firstPlayerAnswers: FirstPlayerAnswers[];

  @OneToMany(() => SecondPlayerAnswers, (a) => a.game, { eager: true })
  secondPlayerAnswers: SecondPlayerAnswers[];

  @OneToMany(() => Questions, (q) => q.game, { eager: true })
  questions: Questions[];

  static create(user: UserViewModel, startGameDate?: string | null) {
    const newGame = new Games();
    newGame.firstPlayerId = user.id;
    newGame.firstPlayerLogin = user.login;
    newGame.secondPlayerId = null;
    newGame.secondPlayerLogin = null;
    newGame.firstPlayerScore = 0;
    newGame.secondPlayerScore = 0;
    newGame.pairCreatedDate = new Date().toISOString();
    newGame.startGameDate = startGameDate;
    newGame.finishGameDate = null;
    newGame.status = GameStatuses.PendingSecondPlayer;
    return newGame;
  }
}
