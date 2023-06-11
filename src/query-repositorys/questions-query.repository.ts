import { Injectable, Scope } from '@nestjs/common';
import { PaginationType, SortDirection } from '../types/types';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Questions } from '../entities/questions.entity';
import { QuestionViewModel } from '../models/models';

@Injectable({ scope: Scope.DEFAULT })
export class QuestionsQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Questions)
    private readonly questionModel: Repository<Questions>,
  ) {}

  private fromQuestionDBTypeToQuestionViewModelWithPagination(
    questions: Questions[],
  ): QuestionViewModel[] {
    return questions.map((question) => ({
      id: question.id,
      body: question.body,
      correctAnswers: question.correctAnswers,
      published: question.published,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    }));
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
      .select('*')
      .from(Questions, 'questions');

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
      this.fromQuestionDBTypeToQuestionViewModelWithPagination(questions);

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
    return await this.questionModel
      .createQueryBuilder('question')
      .orderBy('RANDOM()')
      .take(5)
      .getMany();
  }
}
