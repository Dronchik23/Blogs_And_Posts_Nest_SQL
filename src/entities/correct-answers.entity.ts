import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Questions } from './questions.entity';

@Entity({ name: 'correctAnswers' })
export class CorrectAnswers {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ nullable: true, type: 'uuid' })
  questionsId: string;

  @Column({ nullable: true })
  answer1: string;

  @Column({ nullable: true })
  answer2: string;

  @OneToOne(() => Questions, (q) => q.correctAnswers, { cascade: true })
  @JoinColumn()
  questions?: Questions;

  static create(answers: string[]) {
    const newCorrectAnswers = new CorrectAnswers();
    newCorrectAnswers.answer1 = answers[0];
    newCorrectAnswers.answer2 = answers[1];
    return newCorrectAnswers;
  }
}
