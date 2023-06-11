import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AnswerStatuses } from '../types/types';
import { GameProgresses } from './game-progresses';

@Entity()
export class Answers {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ enum: AnswerStatuses, nullable: true })
  firstPlayerAnswerStatus: AnswerStatuses;

  @Column({ nullable: true })
  firstPlayerQuestionId: string;

  @Column({ nullable: true })
  gameProgressId: string;

  @Column({ nullable: true })
  firstPlayerAddedAt: string;

  @Column({ enum: AnswerStatuses, nullable: true })
  secondPlayerAnswerStatus: AnswerStatuses;

  @Column({ nullable: true })
  secondPlayerQuestionId: string;

  @Column({ nullable: true })
  secondPlayerAddedAt: string;

  @ManyToOne(() => GameProgresses, (progress) => progress.answers)
  gameProgress: GameProgresses;

  /*  static create(questionId: string, answerStatus: AnswerStatuses) {
      const newAnswer = new Answers();
      newAnswer.answerStatus = answerStatus;
      newAnswer.questionId = questionId;
      newAnswer.addedAt = new Date().toISOString();
      return newAnswer;
    }*/
}
