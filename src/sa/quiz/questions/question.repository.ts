import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  PublishQuestionModel,
  QuestionInputModel,
  QuestionUpdateModel,
  QuestionViewModel,
} from '../../../models/models';
import { Questions } from '../../../entities/questions.entity';

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
      const question = await this.questionModel.findOneBy({ id: questionId });
      if (!question) {
        throw new NotFoundException();
      }

      const result = await this.questionModel.delete({ id: questionId });

      return result.affected > 0;
    } catch (error) {
      console.error(error);
    }
  }

  async updateQuestionByQuestionId(
    questionId: string,
    updateQuestionDto: QuestionUpdateModel,
    updatedAt: string,
  ): Promise<any> {
    try {
      const question = await this.questionModel.findOneBy({ id: questionId });
      if (!question) {
        throw new NotFoundException();
      }

      question.body = updateQuestionDto.body;
      question.correctAnswers = updateQuestionDto.correctAnswers;
      question.updatedAt = updatedAt;

      return await this.questionModel.save(question);
    } catch (error) {
      throw new NotFoundException();
    }
  }

  async publishQuestion(
    questionId: string,
    publishQuestionDTO: PublishQuestionModel,
    updatedAt: string,
  ): Promise<boolean> {
    try {
      const question = await this.questionModel.findOneBy({ id: questionId });
      if (!question) {
        throw new NotFoundException();
      }

      const result = await this.questionModel.update(questionId, {
        published: publishQuestionDTO.published,
        updatedAt: updatedAt,
      });
      return result.affected > 0;
    } catch (e) {
      throw new NotFoundException();
    }
  }
}
