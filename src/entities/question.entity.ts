import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuestionInputModel } from '../models/models';

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

  /*   @ManyToOne(() => Users, (u) => u.blogs)
    blogOwner: Users;

    @OneToMany(() => Posts, (p) => p.postsBlog)
    postsBlog: Posts[];*/

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
