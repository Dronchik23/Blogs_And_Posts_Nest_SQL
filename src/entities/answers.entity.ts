import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AnswerStatuses } from '../types/types';
import { Games } from './games.entity';
import { GameProgresses } from './game-progresses.entity';

@Entity()
export class Answers {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ enum: AnswerStatuses, nullable: true })
  answerStatus: AnswerStatuses;

  @Column()
  questionId: string;

  @Column()
  addedAt: string;

  @ManyToOne(() => GameProgresses, (gp) => gp.answers)
  answersGameProgress: GameProgresses;
}
