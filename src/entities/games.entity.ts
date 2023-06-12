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

  @Column({ nullable: true, type: 'uuid' })
  gameProgressId: string;

  @OneToOne(() => GameProgresses, (g) => g.game, { eager: true })
  gameProgress: GameProgresses;

  @OneToMany(() => Questions, (q) => q.game)
  questions: Questions[];

  static create(
    questions: QuestionViewModel[],
    gameProgressId: string,
    players: Players,
    answers: Answers,
    startGameDate?: string | null,
  ) {
    const newGame = new Games();
    newGame.pairCreatedDate = new Date().toISOString();
    newGame.startGameDate = startGameDate;
    newGame.finishGameDate = null;
    newGame.questions = questions.map((q) => {
      return {
        id: q.id,
        body: q.body,
        correctAnswers: q.correctAnswers,
        published: q.published,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        gameId: q.gameId,
      };
    });
    newGame.status = GameStatuses.PendingSecondPlayer;
    newGame.gameProgressId = gameProgressId;
    return newGame;
  }
}
