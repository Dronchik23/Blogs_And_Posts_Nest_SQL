import { Injectable, Scope } from '@nestjs/common';
import { PaginationType, SortDirection } from '../types/types';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Questions } from '../entities/questions.entity';
import { QuestionViewModel } from '../models/models';
import { CorrectAnswers } from '../entities/correct-answers.entity';

@Injectable({ scope: Scope.DEFAULT })
export class QuestionsQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Questions)
    private readonly questionModel: Repository<Questions>,
  ) {}

  private fromQuestionDBTypeToQuestionViewModelArray(
    questions: Questions[],
  ): QuestionViewModel[] {
    return questions.map((question) => ({
      id: question.id,
      body: question.body,
      correctAnswers: [
        question.correctAnswers.answer1,
        question.correctAnswers.answer2,
      ],
      published: question.published,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      gameId: question.gameId,
    }));
  }

  private fromRawSQLQuestionTypeToQuestionViewModelArray(
    questions: any,
  ): QuestionViewModel[] {
    const mapped = questions.map((question) => ({
      id: question.id,
      body: question.body,
      correctAnswers: [question.answer1, question.answer2],
      published: question.published,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    }));
    return mapped;
  }

  async getAllQuestions(
    bodySearchTerm: string,
    publishedStatus: string,
    sortBy: string,
    sortDirection: string,
    pageNumber: number,
    pageSize: number,
  ): Promise<PaginationType> {
    const builder = await this.dataSource
      .createQueryBuilder()
      .select([
        'questions.id as id',
        'questions.body as body',
        'questions.published as published',
        'questions."createdAt"',
        'questions."updatedAt"',
        'questions."gameId"',
        'answers."answer1"',
        'answers."answer2"',
      ])
      .from(Questions, 'questions')
      .leftJoin(
        CorrectAnswers,
        'answers',
        'answers."questionsId" = questions.id',
      );

    if (bodySearchTerm) {
      builder.andWhere('questions.body ILIKE :bodySearchTerm', {
        searchNameTerm: `%${bodySearchTerm}%`,
      });
    }

    const questions: any = await builder
      .orderBy(
        `questions.${sortBy} COLLATE "C"`,
        sortDirection.toUpperCase() as SortDirection,
      )
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getRawMany();

    const totalCount: number = await builder.getCount();

    const mappedQuestions =
      this.fromRawSQLQuestionTypeToQuestionViewModelArray(questions);

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount === 0 ? 1 : pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: mappedQuestions,
    };
  }

  async getFiveRandomQuestions(): Promise<QuestionViewModel[]> {
    const rawQuestions = await this.questionModel
      .createQueryBuilder('question')
      .orderBy('RANDOM()')
      .take(5)
      .getMany();

    return this.fromRawSQLQuestionTypeToQuestionViewModelArray(rawQuestions);
  }
}
