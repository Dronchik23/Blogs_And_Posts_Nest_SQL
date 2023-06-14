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
import { CorrectAnswers } from '../../../entities/correct-answers.entity';

@Injectable({ scope: Scope.DEFAULT })
export class QuestionRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Questions)
    private readonly questionModel: Repository<Questions>,
    @InjectRepository(CorrectAnswers)
    private readonly correctAnswersModel: Repository<CorrectAnswers>,
  ) {}

  async createQuestion(
    createQuestionDTO: QuestionInputModel,
  ): Promise<QuestionViewModel> {
    const answers = ['answer1', 'answer2'];
    const newCorrectAnswers = CorrectAnswers.create(answers);
    const createdCorrectAnswers = await this.correctAnswersModel.save(
      newCorrectAnswers,
    );
    const newQuestion = Questions.create(
      createQuestionDTO,
      createdCorrectAnswers.id,
    );
    const createdQuestion = await this.questionModel.save(newQuestion);

    await this.correctAnswersModel.update(createdCorrectAnswers.id, {
      questionsId: createdQuestion.id,
    });

    const questionWithCorrectAnswers = await this.questionModel.findOneBy({
      id: createdQuestion.id,
    });

    return new QuestionViewModel(
      questionWithCorrectAnswers,
      createdCorrectAnswers,
    );
  }

  async deleteQuestionByQuestionId(questionId: string) {
    try {
      const question = await this.questionModel.findOneBy({ id: questionId });
      if (!question) {
        throw new NotFoundException();
      }

      const result = await this.questionModel.delete({ id: questionId });
      return result.affected > 0;
    } catch (e) {
      throw new NotFoundException();
    }
  }

  async updateQuestionByQuestionId(
    questionId: string,
    updateQuestionDto: QuestionUpdateModel,
    updatedAt: string,
  ): Promise<boolean> {
    try {
      const question = await this.questionModel.findOneBy({ id: questionId });
      if (!question) {
        throw new NotFoundException();
      }

      const result = await this.questionModel.update(questionId, {
        body: updateQuestionDto.body,
        correctAnswers: {
          questionsId: questionId,
          answer1: '1',
          answer2: '2',
        },
        updatedAt: updatedAt,
      });
      return result.affected > 0;
    } catch (e) {
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
