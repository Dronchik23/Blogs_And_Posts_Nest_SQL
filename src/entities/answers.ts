import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AnswerStatuses } from '../types/types';
import { GameProgresses } from './game-progresses';

@Entity()
export class Answers {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ enum: AnswerStatuses, nullable: true })
  firstPlayerAnswerStatus: AnswerStatuses;

  @Column({ nullable: true, type: 'uuid' })
  firstPlayerQuestionId: string;

  @Column({ nullable: true, type: 'uuid' })
  gameProgressId: string;

  @Column({ nullable: true })
  firstPlayerAddedAt: string;

  @Column({ enum: AnswerStatuses, nullable: true })
  secondPlayerAnswerStatus: AnswerStatuses;

  @Column({ nullable: true, type: 'uuid' })
  secondPlayerQuestionId: string;

  @Column({ nullable: true })
  secondPlayerAddedAt: string;

  @ManyToOne(() => GameProgresses, (progress) => progress.answers)
  gameProgress: GameProgresses;

  static create() {
    const newAnswer = new Answers();
    return newAnswer;
  }
}
