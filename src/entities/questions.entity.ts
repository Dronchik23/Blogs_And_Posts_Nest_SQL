import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { QuestionInputModel } from '../models/models';
import { Games } from './games.entity';

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

  @Column({ type: 'text', array: true, nullable: true })
  correctAnswers: string[];

  /*@OneToOne(() => CorrectAnswers, (c) => c.questions, {
    eager: true,
  })
  correctAnswers: string[];*/

  @ManyToOne(() => Games, (qp) => qp.questions)
  game?: Games;

  static create(dto: QuestionInputModel) {
    const newQuestion = new Questions();
    newQuestion.body = dto.body;
    newQuestion.published = false;
    newQuestion.createdAt = new Date().toISOString();
    newQuestion.updatedAt = null;
    newQuestion.correctAnswers = dto.correctAnswers;
    return newQuestion;
  }
}
