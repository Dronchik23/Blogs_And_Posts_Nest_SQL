import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  QuestionInputModel,
  QuestionUpdateModel,
  QuestionViewModel,
} from '../../../models/models';
import { Questions } from '../../../entities/question.entity';

@Injectable({ scope: Scope.DEFAULT })
export class QuestionRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Questions)
    private readonly questionModel: Repository<Questions>,
  ) {}

  async createQuestion(
    createQuestionDTO: QuestionInputModel,
  ): Promise<QuestionViewModel> {
    const newQuestion = Questions.create(createQuestionDTO);
    const createdQuestion = await this.questionModel.save(newQuestion);
    return new QuestionViewModel(createdQuestion);
  }

  async deleteQuestionByQuestionId(questionId: string) {
    try {
      const result = await this.questionModel.delete({ id: questionId });
      return result.affected > 0;
    } catch (e) {
      throw new NotFoundException();
    }
  }

  async updateQuestionByQuestionId(
    questionId: string,
    updateQuestionDto: QuestionUpdateModel,
  ): Promise<boolean> {
    try {
      const result = await this.questionModel.update(questionId, {
        body: updateQuestionDto.body,
        correctAnswers: updateQuestionDto.correctAnswers,
      });
      return result.affected > 0;
    } catch (e) {
      throw new NotFoundException();
    }
  }
}
