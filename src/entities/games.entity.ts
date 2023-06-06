import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GameStatuses, LikeStatus, UserDBType } from '../types/types';
import { Questions } from './question.entity';
import {
  GameViewModel,
  QuestionViewModel,
  UserViewModel,
} from '../models/models';
import { Answers } from './answers.entity';
import { GameProgresses } from './game-progresses.entity';

@Entity({ name: 'games' })
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

  @OneToMany(() => GameProgresses, (g) => g.game, { eager: true })
  gameProgress: GameProgresses[];

  @OneToMany(() => Questions, (q) => q.game, { eager: true })
  questions: Questions[];

  static create(
    questions: QuestionViewModel[],
    firstPlayer: UserViewModel,
    startGameDate: string | null,
    secondPair?: Games,
  ) {
    const newGame = new Games();
    newGame.pairCreatedDate = new Date().toISOString();
    newGame.startGameDate = startGameDate;
    newGame.finishGameDate = null;
    newGame.questions = questions;
    //newGame.gameProgress. = firstPlayer.id;
    //newGame.gameProgress. = firstPlayer.login;
    if (!secondPair) {
      // newGame.secondPlayerId = null;
      //newGame.secondPlayerLogin = null;
      newGame.status = GameStatuses.PendingSecondPlayer;
      return newGame;
    } else {
      //newGame.secondPlayerId = secondPair.firsPlayerId;
      //newGame.secondPlayerLogin = secondPair.firsPlayerLogin;
      newGame.status = GameStatuses.Active;
      return newGame;
    }
  }

  /*  static create(
    questions: QuestionViewModel[],
    firstPlayer: UserViewModel,
    startGameDate: string | null,
    secondPair?: Games,
  ) {
    const newGame = new Games();
    newGame.pairCreatedDate = new Date().toISOString();
    newGame.startGameDate = startGameDate;
    newGame.finishGameDate = null;
    newGame.questions = questions;
    newGame.gameProgress. = firstPlayer.id;
    newGame.gameProgress. = firstPlayer.login;
    if (!secondPair) {
      newGame.secondPlayerId = null;
      newGame.secondPlayerLogin = null;
      newGame.status = GameStatuses.PendingSecondPlayer;
      return newGame;
    } else {
      newGame.secondPlayerId = secondPair.firsPlayerId;
      newGame.secondPlayerLogin = secondPair.firsPlayerLogin;
      newGame.status = GameStatuses.Active;
      return newGame;
    }
  }*/
}
