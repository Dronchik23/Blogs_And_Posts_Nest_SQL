import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GameStatuses, UserDBType } from '../types/types';
import { Questions } from './question.entity';
import { GameProgress } from './game-progress.entity';

@Entity({ name: 'quizPairs' })
export class QuizPairs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  pairCreatedDate: string;

  @Column()
  status: GameStatuses;

  @Column({ nullable: true })
  startGameDate: string;

  @Column({ nullable: true })
  finishGameDate: string;

  @Column()
  firsPlayerId: string;

  @Column()
  firsPlayerLogin: string;

  @Column({ default: 0 })
  firsPlayerScore: number;

  @Column({ default: null })
  secondPlayerId: string;

  @Column({ default: null })
  secondPlayerLogin: string;

  @Column({ default: null })
  secondPlayerScores: string;

  @OneToMany(() => Questions, (q) => q.quizPare, { eager: true })
  questions: Questions[];

  /*  static create(
    currentUser: UserViewModel,
    secondUser: UserDBType,
    startGameDate: string | null,
  ) {
    if (!secondUser) {
    }
    const newPair = new QuizPairs();
    newPair.pairCreatedDate = new Date().toISOString();
    newPair.status = GameStatuses.PendingSecondPlayer;
    newPair.startGameDate = startGameDate;
    newPair.finishGameDate = null;
    //newPair.questions = Questions[];
    newPair.gameProgress.firsPlayerId = currentUser.id;
    newPair.gameProgress.firsPlayerLogin = currentUser.login;
    newPair.gameProgress.secondPlayerId = secondUser.id;
    newPair.gameProgress.secondPlayerLogin = secondUser.login;
    return newPair;
  }*/
}
