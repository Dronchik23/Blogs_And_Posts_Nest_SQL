import {
  Column,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuestionInputModel } from '../models/models';
import { Games } from './games.entity';
import { CorrectAnswers } from './correct-answers.entity';

@Entity()
export class Questions {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  body: string;

  @Column({ nullable: true, type: 'uuid' })
  correctAnswersId: string;

  @Column()
  published: boolean;

  @Column()
  createdAt: string;

  @Column({ default: null })
  updatedAt: string;

  @Column({ nullable: true, type: 'uuid' })
  gameId: string;

  @OneToOne(() => CorrectAnswers, (c) => c.questions, {
    eager: true,
  })
  correctAnswers: CorrectAnswers;

  @ManyToOne(() => Games, (qp) => qp.questions)
  game?: Games;

  static create(dto: QuestionInputModel, correctAnswersId: string) {
    const newQuestion = new Questions();
    newQuestion.body = dto.body;
    newQuestion.published = false;
    newQuestion.createdAt = new Date().toISOString();
    newQuestion.updatedAt = null;
    newQuestion.correctAnswersId = correctAnswersId;
    return newQuestion;
  }
}
