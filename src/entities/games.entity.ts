import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GameStatuses } from '../types/types';
import { Questions } from './questions.entity';
import { QuestionViewModel } from '../models/models';
import { GameProgresses } from './game-progresses';
import { Players } from './players.entity';
import { Answers } from './answers';

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

  @OneToOne(() => GameProgresses)
  @JoinColumn()
  gameProgress: GameProgresses;

  @OneToMany(() => Questions, (q) => q.game, { eager: true })
  questions: Questions[];

  static create(
    questions: QuestionViewModel[],
    gameProgress: GameProgresses,
    players: Players,
    answers: Answers,
    startGameDate?: string | null,
  ) {
    const newGame = new Games();
    newGame.pairCreatedDate = new Date().toISOString();
    newGame.startGameDate = startGameDate;
    newGame.finishGameDate = null;
    newGame.questions = questions;
    newGame.status = GameStatuses.PendingSecondPlayer;
    newGame.gameProgress = gameProgress;
    newGame.gameProgress.firstPlayerScore = 0;
    newGame.gameProgress.secondPlayerScore = 0;
    newGame.gameProgress.players = {
      firstPlayerId: players.firstPlayerId,
      firstPlayerLogin: players.firstPlayerLogin,
      secondPlayerId: players.secondPlayerId,
      secondPlayerLogin: players.secondPlayerLogin,
    };
    newGame.gameProgress.players.firstPlayerId = players.firstPlayerId;
    newGame.gameProgress.players.firstPlayerLogin = players.firstPlayerLogin;
    newGame.gameProgress.answers = [];
    return newGame;
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
