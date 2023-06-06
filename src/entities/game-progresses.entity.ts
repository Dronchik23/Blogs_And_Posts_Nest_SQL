import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GameStatuses, LikeStatus, UserDBType } from '../types/types';
import { Questions } from './question.entity';
import {
  GameViewModel,
  QuestionViewModel,
  UserViewModel,
} from '../models/models';
import { Answers } from './answers.entity';
import { Players } from './players.entity';
import { Games } from './games.entity';

@Entity({ name: 'gameProgress' })
export class GameProgresses {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 0, nullable: true })
  score: number;

  @Column({ default: null })
  finishGameDate: string;

  @OneToMany(() => Players, (p) => p.gameProgress, { eager: true })
  player: Players[];

  @OneToMany(() => Answers, (a) => a.answersGameProgress, { eager: true })
  answers: Answers[];

  @ManyToOne(() => Games, (g) => g.gameProgress)
  game: Games;
}
