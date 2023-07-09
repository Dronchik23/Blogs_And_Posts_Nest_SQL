import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AnswerStatuses } from '../types/types';
import { Games } from './games.entity';

@Entity({ name: 'secondPlayerAnswers' })
export class SecondPlayerAnswers {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  gameId: string;

  @Column({ enum: AnswerStatuses, nullable: true })
  answerStatus: AnswerStatuses;

  @Column({ nullable: true, type: 'uuid' })
  questionId: string;

  @Column({ nullable: true })
  addedAt: string;

  @ManyToOne(() => Games, (g) => g.secondPlayerAnswers)
  game?: Games;

  static create() {
    const newSecondPlayerAnswer = new SecondPlayerAnswers();
    return newSecondPlayerAnswer;
  }
}
