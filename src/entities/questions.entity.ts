import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { QuestionInputModel } from '../models/models';
import { Games } from './games.entity';

@Entity()
export class Questions {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  body: string;

  @Column({ type: 'text', array: true, default: [] })
  correctAnswers: string[];

  @Column()
  published: boolean;

  @Column()
  createdAt: string;

  @Column({ default: null })
  updatedAt: string;

  @Column({ nullable: true, type: 'uuid' })
  gameId: string;

  @ManyToOne(() => Games, (qp) => qp.questions, { eager: true })
  game?: Games;

  static create(dto: QuestionInputModel) {
    const newQuestion = new Questions();
    newQuestion.body = dto.body;
    newQuestion.correctAnswers = dto.correctAnswers;
    newQuestion.published = false;
    newQuestion.createdAt = new Date().toISOString();
    newQuestion.updatedAt = null;
    return newQuestion;
  }
}
